<template>
  <div class="server-create-index">
    <page-header :title="headerTitle" :tabs="cloudEnvOptions" :current-tab.sync="cloudEnv" />
    <component :is="component" :type="type" />
  </div>
</template>

<script>
import { getCloudEnvOptions } from '@/utils/common/hypervisor'
import IDC from './form/IDC'
import Public from './form/Public'
import Private from './form/Private'

export default {
  name: 'VMInstanceCreate',
  components: {
    IDC,
    Public,
    Private,
  },
  data () {
    const cloudEnvOptions = getCloudEnvOptions('compute_engine_brands', true)
    const queryType = this.$route.query.type
    let cloudEnv = queryType === 'idc' ? 'onpremise' : this.$route.query.type
    let routerQuery = this.$route.query.type
    if (!cloudEnvOptions.find(val => val.key === cloudEnv)) {
      cloudEnv = cloudEnvOptions[0].key
      routerQuery = cloudEnv === 'onpremise' ? 'idc' : cloudEnv
    }
    return {
      cloudEnvOptions,
      cloudEnv,
      routerQuery,

    }
  },
  computed: {
    type () {
      const { type = 'idc' } = this.$route.query
      switch (type) {
        case 'private':
          return 'private'
        case 'public':
          return 'public'
        default:
          return 'idc'
      }
    },
    component () {
      const { type = 'idc' } = this.$route.query
      switch (type) {
        case 'private':
          return 'Private'
        case 'public':
          return 'Public'
        default:
          return 'IDC'
      }
    },
    headerTitle () {
      let res
      if (this.$route.query.source === 'servertemplate') {
        res = this.$t('compute.text_257')
      } else {
        res = this.$t('compute.text_91')
      }
      return this.$t('compute.text_1161', [res])
    },
  },
  watch: {
    cloudEnv (val) {
      this.$nextTick(() => {
        const query = this.getQuery(this.$router.history.current.query)
        const path = this.$router.history.current.path
        const newQuery = JSON.parse(JSON.stringify(query))
        newQuery.type = val === 'onpremise' ? 'idc' : val
        this.$router.push({ path, query: newQuery })
      })
    },
  },
  created () {
    if (this.routerQuery !== this.$route.query.type) {
      this.$router.push({
        path: this.$router.history.current.path,
        query: {
          type: this.routerQuery,
        },
      })
    }
  },
  mounted () {
    this.detectBack() // 在用户点击 back 的时候，表单的处理方案
  },
  beforeDestroy () {
    window.removeEventListener('popstate', this.popstate)
  },
  methods: {
    detectBack () {
      window.addEventListener('popstate', this.popstate, false)
    },
    popstate (e) {
      if (e.state) {
        // 侦测是用户触发的后退操作, dosomething
        // 这里刷新当前 url
        window.location.reload()
      }
    },
    getQuery (query) {
      if (query.sence === 'image') {
        return { type: query.type }
      }
      return query
    },
  },
}
</script>
