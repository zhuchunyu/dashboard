<template>
  <div>
    <a-form
      class="mt-3"
      :form="form.fc"
      v-bind="formItemLayout"
      @submit="submit"
      hideRequiredMark>
      <a-form-item :label="$t('compute.text_297', [$t('dictionary.project')])" v-show="false">
        <domain-project
          :fc="form.fc"
          :fd="form.fd"
          :decorators="{ project: decorators.project, domain: decorators.domain }"
          @fetchDomainCallback="fetchDomainCallback"
          @fetchProjectCallback="fetchProjectCallback" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_177')" class="mb-0" v-show="false">
        <cloudregion-zone
          :zone-params="zoneParams"
          :cloudregion-params="cloudregionParams"
          :decorator="decorators.cloudregionZone"
          filterBrandResource="compute_engine" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_294')">
        <a-input-number v-decorator="decorators.count" @blur="countBlur" :min="1" :max="100" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_176')" :extra="$t('compute.text_1151')">
        <hypervisor-radio :decorator="decorators.hypervisor" :type="form.fi.createType" :hypervisors="hypervisors" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_1365')" v-if="isKvm && form.fi.capability.host_cpu_archs">
        <os-arch
          v-decorator="decorators.os_arch"
          :form="form"
          :options="archOptions" />
      </a-form-item>
      <a-form-item v-if="form.fd.hypervisor === 'kvm'" :label="$t('compute.text_1152')">
        <gpu :decorators="decorators.gpu" :gpu-options="gpuOptions" @change="gpuChange" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_1058')" class="mb-0">
        <cpu-radio :decorator="decorators.vcpu" :options="form.fi.cpuMem.cpus || []" @change="cpuChange" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_369')" class="mb-0">
        <mem-radio :decorator="decorators.vmem" :options="form.fi.cpuMem.mems_mb || []" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_109')" v-if="showSku">
        <sku
          v-decorator="decorators.sku"
          :type="type"
          :sku-params="skuParam"
          :hypervisor="form.fd.hypervisor" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_49')" class="mb-0">
        <system-disk
          v-if="form.fd.hypervisor"
          :decorator="decorators.systemDisk"
          :isServertemplate="isServertemplate"
          :type="type"
          :form="form"
          :hypervisor="form.fd.hypervisor"
          :sku="form.fd.sku"
          :capability-data="form.fi.capability"
          :image="form.fi.imageMsg"
          :defaultSize="systemdiskDefaultSize"
          :isHostImageType="isHostImageType"
          :disabled="form.fi.sysDiskDisabled"
          :sizeDisabled="systemdiskSizeDisabled"
          :storageParams="storageParams"
          :storageHostParams="storageHostParams"
          :domain="project_domain"
          :isStorageShow="isStorageShow"
          @storageHostChange="storageHostChange" />
      </a-form-item>
      <a-form-item :label="$t('compute.text_50')">
        <data-disk
          v-if="form.fd.hypervisor"
          ref="dataDiskRef"
          :decorator="decorators.dataDisk"
          :form="form"
          :type="type"
          :hypervisor="form.fd.hypervisor"
          :sku="form.fd.sku"
          :capability-data="form.fi.capability"
          :isSnapshotImageType="isSnapshotImageType"
          :isHostImageType="isHostImageType"
          :disabled="form.fi.dataDiskDisabled"
          :defaultType="form.fd.systemDiskType"
          :domain="project_domain"
          :isWindows="isWindows"
          :isStorageShow="isStorageShow"
          :enableMointpoint="false"
          :simplify="true"
          :storageParams="dataDiskStorageParams"
          :storageHostParams="storageHostParams"
          @storageHostChange="storageHostChange" />
        <div slot="extra" class="warning-color" v-if="isStorageShow">{{ $t('compute.select_storage_no_schetag') }}</div>
      </a-form-item>
      <bottom-bar
        ref="bottomBarRef"
        :loading="submiting"
        :form="form"
        :type="type"
        :dataDiskSizes="dataDiskSizes"
        :isOpenWorkflow="isOpenWorkflow"
        :errors.sync="errors"
        :isServertemplate="isServertemplate"
        :hasMeterService="hasMeterService"
        @getOriginPrice="getOriginPrice" />
    </a-form>
  </div>
</template>
<script>
import _ from 'lodash'
import * as R from 'ramda'
import { HYPERVISORS_MAP } from '@/constants'
import { resolveValueChangeField } from '@/utils/common/ant'
import { IMAGES_TYPE_MAP, STORAGE_TYPES, HOST_CPU_ARCHS } from '@/constants/compute'
import OsArch from '@/sections/OsArch'
import { diskSupportTypeMedium, getOriginDiskKey } from '@/utils/common/hypervisor'
import mixin from './mixin'

export default {
  name: 'VM_IDCCreate',
  components: {
    OsArch,
  },
  mixins: [mixin],
  data () {
    return {
      isLocalDisk: true,
      storageHosts: {}, // 所有磁盘的storage-host
      storageHostParams: {}, // 第一个选择的块存储
    }
  },
  computed: {
    isKvm () {
      return this.form.fd.hypervisor === HYPERVISORS_MAP.kvm.key
    },
    isIso () {
      return this.form.fd.imageType === IMAGES_TYPE_MAP.iso.key
    },
    isArm () {
      return this.form.fd.os_arch === HOST_CPU_ARCHS.arm.key
    },
    isLoongarch64 () {
      return this.form.fd.os_arch === HOST_CPU_ARCHS.loongarch64.key
    },
    hypervisors () {
      const { hypervisors = [] } = this.form.fi.capability
      return hypervisors
    },
    cloudregionParams () {
      return {
        cloud_env: 'onpremise',
        usable: true,
        show_emulated: true,
        ...this.scopeParams,
      }
    },
    zoneParams () {
      return {
        usable: true,
        show_emulated: true,
        order_by: 'created_at',
        order: 'asc',
        ...this.scopeParams,
      }
    },
    instanceGroupsParams () {
      return {
        ...this.scopeParams,
        enabled: true,
      }
    },
    cacheImageParams () {
      const params = {
        cloudregion_id: _.get(this.form.fd, 'cloudregion.key'),
        os_arch: HOST_CPU_ARCHS.x86.key,
      }
      if (!params.cloudregion_id) return {}
      if (this.form.fd.imageType === 'vmware') params.image_type = 'system'
      if (this.isArm) params.os_arch = HOST_CPU_ARCHS.arm.key
      if (this.isLoongarch64) params.os_arch = HOST_CPU_ARCHS.loongarch64.key
      return params
    },
    showSku () {
      if (this.form.fd.hypervisor && this.form.fd.vcpu && this.form.fd.vmem) {
        return true
      }
      return false
    },
    skuParam () {
      return {
        limit: 0,
        public_cloud: false,
        postpaid_status: 'available',
        cpu_core_count: this.form.fd.vcpu || this.decorators.vcpu[1].initialValue,
        memory_size_mb: this.form.fd.vmem,
        cloudregion: _.get(this.form, 'fd.cloudregion.key'),
        provider: 'OneCloud',
        ...this.scopeParams,
      }
    },
    // policyHostParams () {
    //   const zone = _.get(this.form.fd, 'zone.key')
    //   if (zone) {
    //     const params = {
    //       enabled: 1,
    //       usable: true,
    //       zone,
    //       hypervisor: this.form.fd.hypervisor,
    //       os_arch: HOST_CPU_ARCHS.x86.key,
    //       ...this.scopeParams,
    //     }
    //     if (params.hypervisor === HYPERVISORS_MAP.esxi.key) {
    //       if (this.form.fd[this.decorators.systemDisk.storage[0]]) {
    //         params.storage_id = this.form.fd[this.decorators.systemDisk.storage[0]]
    //       }
    //       params.cloudprovider = this.form.fd.prefer_manager
    //     }
    //     if (this.isArm) params.os_arch = HOST_CPU_ARCHS.arm.key
    //     return params
    //   }
    //   return {}
    // },
    networkParam () {
      if (!this.cloudregionZoneParams.cloudregion) return {}
      const params = {
        filter: 'server_type.notin(ipmi, pxe)',
        usable: true,
        ...this.cloudregionZoneParams,
        ...this.scopeParams,
      }
      if ([HYPERVISORS_MAP.esxi.key].includes(this.form.fd.hypervisor)) {
        params.host_type = 'esxi'
      }
      if ([HYPERVISORS_MAP.esxi.key, HYPERVISORS_MAP.kvm.key].includes(this.form.fd.hypervisor)) {
        if (this.form.fd[this.decorators.systemDisk.storage[0]]) {
          params.storage_id = this.form.fd[this.decorators.systemDisk.storage[0]]
        }
        if (this.storageHostParams.disk &&
        this.storageHostParams.disk !== 'system' &&
        this.storageHostParams.storageHosts &&
        this.storageHostParams.storageHosts.length &&
        !params.storage_id) {
          if (this.form.fd[`dataDiskStorages[${this.storageHostParams.disk}]`]) {
            params.storage_id = this.form.fd[`dataDiskStorages[${this.storageHostParams.disk}]`]
          }
        }
      }
      return params
    },
    instanceSpecParmas () {
      return {
        usable: true,
        enabled: true,
        cloudregion: _.get(this.form.fd, 'cloudregion.key'),
      }
    },
    showAdvanceConfig () { // 是否展示高级配置
      return this.isKvm || !this.isServertemplate
    },
    uefi () {
      if (this.isKvm && this.form.fd.gpuEnable && this.form.fd.gpu && this.isWindows) {
        return true
      }
      return false
    },
    cloudproviderParamsExtra () {
      const params = {
        ...this.scopeParams,
      }
      if (this.form.fd.hypervisor && this.form.fd.hypervisor) {
        params.provider = HYPERVISORS_MAP[this.form.fd.hypervisor].provider
      }
      return params
    },
    showSchedCloudprovider () { // 创建VMware机器时，镜像类型不是 VMware 平台镜像时调度策略可以选择指定云账号
      let show = false
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.esxi.key) {
        if (this.form.fd.imageType !== IMAGES_TYPE_MAP.vmware.key) {
          show = true
        }
      }
      return show
    },
    systemdiskSizeDisabled () {
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.esxi.key) {
        const vmLocalImageType = [IMAGES_TYPE_MAP.vmware.key]
        if (vmLocalImageType.includes(this.form.fd.imageType)) {
          return true
        }
      }
      return false
    },
    systemdiskDefaultSize () {
      if (this.isIso) {
        return 30
      }
      return null
    },
    availableHostCount () { // 可用的宿主机数量
      if (R.is(Object, this.form.fi.capability)) {
        return this.form.fi.capability.available_host_count || 0
      }
      return 0
    },
    eipParams () {
      if (!this.cloudregionZoneParams.cloudregion) return {}
      return {
        project: this.project,
        region: this.cloudregionZoneParams.cloudregion,
      }
    },
    showEip () {
      const { vpcs } = this.form.fd
      if (R.is(Object, vpcs)) {
        const vpcList = Object.values(vpcs)
        if (vpcList.length && !~vpcList.indexOf('default')) {
          return this.enableEip
        }
      }
      return false
    },
    storageParams () {
      const { systemDiskType = {}, hypervisor } = this.form.fd
      let key = systemDiskType.key || ''
      // 磁盘区分介质
      if (diskSupportTypeMedium(hypervisor)) {
        key = getOriginDiskKey(key)
      }
      const params = {
        ...this.scopeParams,
        usable: true, // 包含了 enable:true, status为online的数据
        brand: HYPERVISORS_MAP[this.form.fd.hypervisor]?.brand, // kvm,vmware支持指定存储
        manager: this.form.fd.prefer_manager,
      }
      if (key) {
        params.filter = [`storage_type.contains("${key}")`]
      }
      return params
    },
    dataDiskStorageParams () {
      const { dataDiskSizes = {}, hypervisor } = this.form.fd
      let dataDiskType = ''
      for (const key in dataDiskSizes) {
        if (this.form.fd[`dataDiskTypes[${key}]`]) {
          dataDiskType = this.form.fd[`dataDiskTypes[${key}]`].key
          // 磁盘区分介质
          if (diskSupportTypeMedium(hypervisor)) {
            dataDiskType = getOriginDiskKey(dataDiskType)
          }
        }
      }
      const params = {
        ...this.scopeParams,
        usable: true, // 包含了 enable:true, status为online的数据
        brand: HYPERVISORS_MAP[this.form.fd.hypervisor]?.brand, // kvm,vmware支持指定存储
        manager: this.form.fd.prefer_manager,
      }
      if (dataDiskType) {
        params.filter = [`storage_type.contains("${dataDiskType}")`]
      }
      return params
    },
    isStorageShow () { // 是否开启了指定存储
      if ([HYPERVISORS_MAP.esxi.key, HYPERVISORS_MAP.kvm.key].includes(this.form.fd.hypervisor)) {
        if (this.form.fd[this.decorators.systemDisk.storage[0]]) {
          return true
        }
        if (this.storageHostParams.disk &&
        this.storageHostParams.disk !== 'system' &&
        this.storageHostParams.storageHosts &&
        this.storageHostParams.storageHosts.length) {
          if (this.form.fd[`dataDiskStorages[${this.storageHostParams.disk}]`]) {
            return true
          }
        }
      }
      return false
    },
    imageParams () {
      const params = {
        ...this.scopeParams,
        os_arch: HOST_CPU_ARCHS.x86.key,
      }
      if (this.isArm) params.os_arch = HOST_CPU_ARCHS.arm.key
      if (this.isLoongarch64) params.os_arch = HOST_CPU_ARCHS.loongarch64.key
      return params
    },
    archOptions () {
      let opts = []
      if (this.form.fi.capability.host_cpu_archs && this.form.fi.capability.host_cpu_archs.length) {
        opts = this.form.fi.capability.host_cpu_archs.map(item => {
          if (item === HOST_CPU_ARCHS.arm.capabilityKey) return HOST_CPU_ARCHS.arm.key
          if (item === HOST_CPU_ARCHS.x86.capabilityKey) return HOST_CPU_ARCHS.x86.key
          if (item === HOST_CPU_ARCHS.loongarch64.capabilityKey) return HOST_CPU_ARCHS.loongarch64.key
          return item
        })
      }
      return opts
    },
    extra () {
      if (this.isIso && this.isWindows) {
        return this.$t('compute.iso_windows_help')
      }
      return this.$t('compute.text_302')
    },
  },
  watch: {
    'form.fi.imageMsg': {
      deep: true,
      handler (val, oldVal) {
        if (R.equals(val, oldVal)) return
        this.$nextTick(() => {
          this.form.fi.dataDiskDisabled = false
          this.form.fi.sysDiskDisabled = false
          if (this.form.fd.imageType === IMAGES_TYPE_MAP.host.key) {
            const { root_image: rootImage, data_images: dataImages } = this.form.fi.imageMsg
            const systemDiskSize = rootImage.min_disk_mb / 1024
            const systemDiskType = { // 这里写死即可，因为主机镜像仅 kvm 型机器，且和系统盘类型无瓜葛 @郑雨
              key: STORAGE_TYPES[HYPERVISORS_MAP.kvm.key].local.key,
              label: STORAGE_TYPES[HYPERVISORS_MAP.kvm.key].local.label,
            }
            this.form.fc.setFieldsValue({
              systemDiskSize,
              systemDiskType,
            })
            // 重置数据盘数据
            this._resetDataDisk()
            if (dataImages) {
              dataImages.forEach(val => {
                this.$refs.dataDiskRef.add({ size: val.min_disk_mb / 1024, min: val.min_disk_mb / 1024, minusDisabled: true })
              })
            }
          }
          if (this.form.fd.imageType === IMAGES_TYPE_MAP.snapshot.key) {
            // 镜像类型为主机快照的话要回填数据并禁用
            const snapshots = _.cloneDeep(this.form.fi.imageMsg.server_config.disks)
            if (!snapshots) return
            let sysDisk = snapshots.find(val => val.disk_type === 'sys')
            if (!sysDisk) {
              sysDisk = snapshots.shift()
            }
            const dataDisks = snapshots.filter(val => val.disk_type !== 'sys')
            const data = {
              systemDiskType: {
                key: sysDisk.backend,
                label: STORAGE_TYPES[HYPERVISORS_MAP.kvm.key][sysDisk.backend].label,
              },
              systemDiskSize: sysDisk.size / 1024,
            }
            if (val && R.is(Object, val.server_config)) {
              if (val.server_config.vcpu_count) {
                const cpuValue = val.server_config.vcpu_count
                data[this.decorators.vcpu[0]] = cpuValue
                this.cpuChange(cpuValue)
                if (val.server_config.vmem_size) data[this.decorators.vmem[0]] = val.server_config.vmem_size
              }
            }
            this.form.fc.setFieldsValue(data)
            // 重置数据盘数据
            this._resetDataDisk()
            dataDisks.forEach(val => {
              this.$refs.dataDiskRef.add({ diskType: val.backend, size: val.size / 1024, sizeDisabled: true })
            })
            this.form.fi.dataDiskDisabled = true
            this.form.fi.sysDiskDisabled = true
          } else {
            if (oldVal && R.is(Object, oldVal.server_config)) { // 说明是从主机快照切换过去的
              const vcpuDecorator = this.decorators.vcpu
              const vcpuInit = vcpuDecorator[1].initialValue
              this.form.fc.setFieldsValue({
                [vcpuDecorator[0]]: vcpuInit,
              })
              this.cpuChange(vcpuInit)
            }
          }
        })
      },
    },
    uefi (val) {
      this.setBios(val)
    },
    isArm (val, oldV) {
      this.setBios(val)
    },
  },
  methods: {
    vpcResourceMapper (list) {
      if (this.form.fd.hypervisor === HYPERVISORS_MAP.esxi.key) {
        return list.filter(val => val.id === 'default')
      }
      return list
    },
    onValuesChange (vm, changedFields) {
      this.$nextTick(() => {
        const formValue = this.form.fc.getFieldsValue()
        const newField = resolveValueChangeField(changedFields)
        this._setNewFieldToFd(newField, formValue)
        const keys = Object.keys(newField)
        if (keys.includes('zone') || keys.includes('cloudregion')) {
          this.fetchCapability()
        }
        if (keys.includes('cloudregion')) {
          this.$nextTick(this.fetchInstanceSpecs)
        }
        if (changedFields.schedPolicyType === 'host') {
          this.$set(this.form.fd, 'schedPolicyHost', undefined)
        }
        if (changedFields.backupEnable) {
          this.$set(this.form.fd, 'backup', undefined)
        }
        this.setIsLocalDisk()
      })
    },
    setIsLocalDisk () {
      const isSysLocal = _.get(this.form, 'fd.systemDiskType.key') === 'local'
      const fd = this.form.fc.getFieldsValue()
      let isDiskLocal = true
      const { dataDiskTypes } = fd
      if (!R.is(Object, dataDiskTypes)) return
      const diskTypeItem = dataDiskTypes[Object.keys(dataDiskTypes)[0]]
      if (diskTypeItem && diskTypeItem.key) {
        isDiskLocal = diskTypeItem.key === 'local'
      }
      this.isLocalDisk = isSysLocal && isDiskLocal
    },
    fetchCapability () {
      const params = {
        show_emulated: true,
        resource_type: 'shared',
        ...this.scopeParams,
      }
      let id = this.cloudregionZoneParams.cloudregion
      let resource = 'cloudregions'
      if (this.cloudregionZoneParams.zone) {
        id = this.cloudregionZoneParams.zone
        resource = 'zones'
      }
      const capabilityParams = { id, spec: 'capability', params }
      if (!id) return
      if (R.equals(this.capabilityParams, capabilityParams)) return // 和已有的参数一样则不发请求
      this.capabilityParams = capabilityParams
      new this.$Manager(resource).getSpecific(this.capabilityParams)
        .then(({ data }) => {
          let hypervisors = R.is(Object, data) ? (data.hypervisors || []) : []
          if (hypervisors.includes(HYPERVISORS_MAP.kvm.key)) { // kvm 排序为第一个
            hypervisors = [HYPERVISORS_MAP.kvm.key].concat(hypervisors).filter(val => val !== 'baremetal')
          }
          hypervisors = Array.from(new Set(hypervisors))
          this.form.fi.capability = {
            ...data,
            hypervisors,
          }
          this.form.fc.setFieldsValue({
            hypervisor: hypervisors[0], // 赋值默认第一个平台
          })
        })
    },
    fetchInstanceSpecs () {
      if (!this.instanceSpecParmas.cloudregion) return
      this.serverskusM.get({ id: 'instance-specs', params: this.instanceSpecParmas })
        .then(({ data }) => {
          this.form.fi.cpuMem = data
          const vcpuDecorator = this.decorators.vcpu
          const vcpuInit = vcpuDecorator[1].initialValue
          this.cpuChange(vcpuInit)
        })
    },
    setBios (val) {
      if (val) {
        this.form.fc.getFieldDecorator(this.decorators.bios[0], { preserve: true })
        this.form.fc.setFieldsValue({ [this.decorators.bios[0]]: 'UEFI' })
      } else {
        this.form.fc.setFieldsValue({ [this.decorators.bios[0]]: 'BIOS' })
      }
    },
    gpuChange (val) {
      if (!val) {
        this.form.fc.setFieldsValue({ gpu: '' })
      }
    },

    storageHostChange (val) {
      const { disk } = this.storageHostParams
      if (val.disk) {
        this.storageHosts[val.disk] = val
      }
      // 由第一块选择块存储的盘来确定块存储所在的host
      if (!disk || disk === val.disk) { // 第一块盘选
        if (val.storageHosts && val.storageHosts.length) {
          this.storageHostParams = val
        } else { // 清空操作
          let changeNew = false
          for (const key in this.storageHosts) {
            if (this.storageHosts[key].storageHosts && this.storageHosts[key].storageHosts.length) {
              this.storageHostParams = this.storageHosts[key] // 选其他已选的hosts作为新的范围
              changeNew = true
              break
            }
          }
          if (!changeNew) this.storageHostParams = {}
        }
      }
    },
  },
}
</script>
