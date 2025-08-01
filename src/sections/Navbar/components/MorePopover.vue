<template>
  <div>
    <a-dropdown :trigger="['click']" :getPopupContainer="triggerNode => triggerNode.parentNode">
      <a-tooltip :title="$t('common.more')" placement="right">
        <div class="trigger d-flex align-items-center justify-content-center">
          <icon type="navbar-more" style="font-size: 20px;" />
        </div>
      </a-tooltip>
      <a-menu slot="overlay" @click="handleDropdownClick">
        <a-menu-item key="/guide" v-if="isAdminMode && !isCE() && showMenuMap.feature_select && showMenuMap.more">{{$t('navbar.button.feature_select')}}</a-menu-item>
        <a-menu-item :key="docsUrl" v-if="showMenuMap.docs && showMenuMap.more">{{$t('navbar.button.docs')}}</a-menu-item>
        <a-menu-item key="/licenses" v-if="showMenuMap.about && showMenuMap.more">
          <span>{{isCE() || $store.getters.isSysCE ? $t('scope.text_145') : $t('navbar.button.about')}}</span>
          <a-icon v-if="!isOEM && isAdminMode && updateAvailable" type="cloud-upload" class="success-color ml-1" />
        </a-menu-item>
      </a-menu>
    </a-dropdown>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import setting from '@/config/setting'
import { isCE, genDocsUrl } from '@/utils/utils'

export default {
  name: 'HelpPopover',
  props: {
    showMenuMap: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    return {
      updateAvailable: false,
      isCE,
      isOEM: setting.brand?.en !== setting.defaultBrand.en,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode']),
    docsUrl () {
      return genDocsUrl({ scope: this.$store.getters.scope, isSysCE: this.$store.getters.isSysCE, cePath: 'introduction', eePath: '', anchor: '' })
    },
  },
  destroyed () {
    this.manager = null
  },
  created () {
    if (!this.isOEM && !this.isCE() && !this.$store.getters.isSysCE) {
      this.manager = new this.$Manager('updates', 'v1')
      this.getUpdateInfo()
    }
  },
  methods: {
    getUpdateInfo () {
      this.manager.list({
        params: {
          $t: +new Date(),
        },
      }).then(res => {
        if (res.data.data && res.data.data.length) {
          const updateInfo = R.find(R.propEq('updateAvailable', true))(res.data.data)
          if (updateInfo) {
            this.updateAvailable = true
          }
        }
      })
    },
    handleDropdownClick (item) {
      if (item.key === 'setting') return
      const newWindow = item.key.startsWith('http')
      if (newWindow) {
        this.$openNewWindowForMenuHook('document_configured_callback_address.product_manual_callback_address', () => {
          window.open(item.key)
        })
      } else {
        this.$router.push(item.key)
      }
    },
  },
}
</script>

<style lang="less" scoped>
.trigger {
  height: 100%;
  // padding: 0 20px;
  cursor: pointer;
  text-decoration: none;
}
</style>
