<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_664')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <div slot="message">{{$t('compute.text_665')}}</div>
      </a-alert>
      <a-form
        v-bind="formItemLayout"
        :form="form.fc">
        <a-form-item :label="$t('compute.text_297', [$t('dictionary.project')])" class="mb-0" v-bind="formItemLayout">
          <domain-project :fc="form.fc" :decorators="{ project: decorators.project, domain: decorators.domain }" />
        </a-form-item>
        <a-form-item :label="$t('compute.text_627')" v-bind="formItemLayout">
          <a-input :placeholder="$t('compute.text_416')" v-decorator="decorators.name" />
        </a-form-item>
        <a-form-item :label="$t('compute.text_1365')">
          <os-arch
            v-decorator="decorators.os_arch"
            :form="form" />
        </a-form-item>
        <a-form-item :label="$t('compute.text_667')" v-bind="formItemLayout">
          <a-radio-group @change="handleUploadTypeChange" v-decorator="decorators.uploadType">
            <a-radio-button value="file">{{$t('compute.text_668')}}</a-radio-button>
            <a-radio-button value="url">{{$t('compute.text_669')}}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item :label="$t('compute.text_670')" v-bind="formItemLayout" v-if="byUpload" :help="$t('compute.text_671')">
          <a-upload
            @change="handleUploadChange"
            :fileList="fileList"
            :beforeUpload="beforeUpload">
            <a-button> <a-icon type="upload" />{{$t('compute.text_245')}}</a-button>
          </a-upload>
          <a-progress
            v-if="loading"
            :strokeColor="{ from: '#108ee9', to: '#87d068' }"
            :percent="imageUploadPercent"
            status="active" />
        </a-form-item>
        <a-form-item :label="$t('compute.text_672')" v-bind="formItemLayout" v-if="!byUpload">
          <a-input :placeholder="$t('compute.text_673')" v-decorator="decorators.copy_from" />
        </a-form-item>
        <a-form-item :label="$t('compute.text_267')" v-bind="formItemLayout">
          <a-radio-group v-decorator="decorators.os_type">
            <a-radio-button value="Linux">
              Linux
            </a-radio-button>
            <a-radio-button value="Windows">
              Windows
            </a-radio-button>
            <a-radio-button value="other">{{$t('compute.text_674')}}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="enableEncryption" :label="$t('compute.image.encryption')" :extra="$t('compute.image.encryption.extra')">
          <encrypt-keys :decorators="decorators.encrypt_keys" />
        </a-form-item>
      </a-form>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import * as R from 'ramda'
// import _ from 'lodash'
import { isRequired } from '@/utils/validate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import DomainProject from '@/sections/DomainProject'
import i18n from '@/locales'
import OsArch from '@/sections/OsArch'
import { HOST_CPU_ARCHS } from '@/constants/compute'
import EncryptKeys from '@Compute/sections/encryptkeys'

export default {
  name: 'ImageUploadDialog',
  components: {
    DomainProject,
    OsArch,
    EncryptKeys,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        fc: this.$form.createForm(this),
      },
      decorators: {
        domain: [
          'domain',
          {
            rules: [
              { validator: isRequired(), message: i18n.t('rules.domain'), trigger: 'change' },
            ],
          },
        ],
        project: [
          'project',
          {
            rules: [
              { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
            ],
          },
        ],
        name: [
          'name',
          {
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('compute.text_660') },
              { validator: this.$validate('imageName') },
              { validator: this.checkTemplateName },
            ],
          },
        ],
        uploadType: [
          'uploadType',
          {
            initialValue: 'file',
          },
        ],
        copy_from: [
          'copy_from',
          {
            validateFirst: true,
            rules: [
              { required: true, message: this.$t('compute.text_673') },
              { validator: this.validateUrl },
            ],
          },
        ],
        os_type: [
          'os_type',
          {
            initialValue: 'Linux',
          },
        ],
        os_arch: [
          'os_arch',
          {
            initialValue: HOST_CPU_ARCHS.x86.key,
          },
        ],
        // os_bit: [
        //   'os_bit',
        //   {
        //     initialValue: '64',
        //   },
        // ],
        encrypt_keys: {
          encryptEnable: [
            'encryptEnable',
            {
              initialValue: '',
            },
          ],
          encrypt_key_alg: [
            'encrypt_key_alg',
            {
              initialValue: '',
            },
          ],
          encrypt_key_id: [
            'encrypt_key_id',
          ],
        },
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      byUpload: true,
      fileList: [],
      imageUploadPercent: 0,
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    headers () {
      return { Authorization: `Bearer ${this.$store.getters.userInfo.session}` }
    },
    enableEncryption () {
      return this.$appConfig.isPrivate && this.$store.getters.isSysCE
    },
  },
  destroyed () {
    this.clearTimer()
  },
  methods: {
    clearTimer () {
      clearTimeout(this.timer)
      clearTimeout(this.percentTimer)
      this.timer = null
      this.percentTimer = null
    },
    beforeUpload (file) {
      this.fileList = [file]
      return false
    },
    handleUploadTypeChange (e) {
      if (e.target.value === 'url') {
        this.byUpload = false
      } else {
        this.byUpload = true
      }
    },
    handleUploadChange ({ file, fileList }) {
      this.fileList = fileList
    },
    checkTemplateName (rule, value, callback) {
      if (!value) {
        return callback(new Error(this.$t('compute.text_660')))
      }
      return new this.$Manager('images', 'v1').list({
        params: {
          name: value,
          scope: this.$store.getters.scope,
        },
      }).then(res => {
        const data = res.data.data
        if (!R.isNil(data) && !R.isEmpty(data)) {
          callback(new Error(this.$t('compute.text_662')))
        } else {
          callback()
        }
      })
    },
    validateUrl (rule, value, callback) {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        callback()
      } else {
        callback(new Error(this.$t('compute.text_675')))
      }
    },
    handleUpload (data) {
      return this.$http({
        url: '/v1/imageutils/upload',
        method: 'post',
        processData: false,
        data,
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          // 计算上传进度百分比
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          this.imageUploadPercent = percent
          if (this.imageUploadPercent >= 100) {
            setTimeout(() => {
              this.cancelDialog()
              this.params.refresh()
            }, 2000)
          }
        },
      })
    },
    doImportUrl (data) {
      const params = {
        domain_id: (data.domain && data.domain.key) || this.userInfo.projectDomainId,
        project_id: (data.project && data.project.key) || this.userInfo.projectId,
        copy_from: data.copy_from,
        name: data.name,
        os_arch: data.os_arch,
        properties: {
          os_type: data.os_type,
          os_version: '',
          os_arch: data.os_arch,
        },
      }
      if (data.encryptEnable === 'existing' && data.encrypt_key_id) {
        params.encrypt_key_id = data.encrypt_key_id
      } else if (data.encryptEnable === 'new') {
        params.encrypt_key_new = true
        params.encrypt_key_alg = data.encrypt_key_alg
        params.encrypt_key_user_id = this.userInfo.id
      }
      return this.params.onManager('create', {
        managerArgs: {
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        const { fileList } = this
        const formData = new FormData()
        const values = await this.form.fc.validateFields()
        formData.append('domain_id', (values.domain && values.domain.key) || this.userInfo.projectDomainId)
        formData.append('project_id', (values.project && values.project.key) || this.userInfo.projectId)
        // const os_bit = values.os_bit
        // if (values.os_arch === HOST_CPU_ARCHS.arm.key) {
        //   values.os_arch = `aarch${os_bit}`
        // } else {
        //   if (os_bit === '64') { // else 情况就是x86，既 os_arch 本身的值
        //     values.os_arch = 'x86-64'
        //   }
        // }
        if (values.uploadType === 'file') {
          formData.append('name', values.name)
          formData.append('os_version', '')
          formData.append('os_arch', values.os_arch)
          formData.append('properties.os_type', values.os_type)
          if (values.encryptEnable === 'existing' && values.encrypt_key_id) {
            formData.append('encrypt_key_id', values.encrypt_key_id)
          } else if (values.encryptEnable === 'new') {
            formData.append('encrypt_key_new', true)
            formData.append('encrypt_key_alg', values.encrypt_key_alg)
            formData.append('encrypt_key_user_id', this.userInfo.id)
          }
          if (fileList.length > 0) {
            formData.append('image_size', fileList[0].size)
            fileList.forEach(file => {
              formData.append('image', file.originFileObj)
            })
          } else {
            this.$message.error(this.$t('compute.text_676'))
            this.loading = false
            return false
          }
          this.handleUpload(formData)
            .then(() => {})
            .catch(() => {
              this.loading = false
              this.clearTimer()
            })
          // this.getProcessBarInfo()
        } else {
          await this.doImportUrl(values)
          this.cancelDialog()
          this.params.refresh()
        }
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    fetchImageInfoByName () {
      const imageManager = new this.$Manager('images', 'v1')
      const name = this.form.fc.getFieldValue('name')
      return imageManager.list({ params: { name, scope: this.$store.getters.scope } })
    },
    // getProcessBarInfo () {
    //   this.clearTimer()
    //   this.timer = setInterval(() => {
    //     this.fetchImageInfoByName()
    //       .then((res) => {
    //         const imageInfo = res.data && res.data.data && res.data.data[0]
    //         if (this.fileList && this.fileList.length > 0) {
    //           if (imageInfo) {
    //             const percent = (imageInfo.size / this.fileList[0].size) * 100
    //             if (percent === 100) {
    //               this.percentTimer = setTimeout(() => {
    //                 this.imageUploadPercent = _.floor(percent)
    //               }, 5000)
    //             } else {
    //               this.imageUploadPercent = _.floor(percent)
    //             }
    //           }
    //         }
    //         if (this.imageUploadPercent >= 100) {
    //           this.cancelDialog()
    //           this.params.refresh()
    //         }
    //       })
    //   }, 5000)
    // },
  },
}
</script>
