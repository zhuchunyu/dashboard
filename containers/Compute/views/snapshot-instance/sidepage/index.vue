<template>
  <base-side-page
    @cancel="cancelSidePage"
    :title="$t('compute.text_102')"
    icon="res-instance-snapshot"
    :res-name="detailData.name"
    :current-tab="params.windowData.currentTab"
    :tabs="detailTabs"
    :loaded="loaded"
    @tab-change="handleTabChange">
    <template v-slot:actions>
      <actions :options="singleActions" :row="detailData" button-type="link" button-size="small" />
    </template>
    <component
      :is="params.windowData.currentTab"
      :data="detailData"
      :res-id="data.id"
      :id="listId"
      :on-manager="onManager"
      :columns="columns"
      taskResource="compute-tasks"
      @tab-change="handleTabChange" />
  </base-side-page>
</template>

<script>
import SidePageMixin from '@/mixins/sidePage'
import WindowsMixin from '@/mixins/windows'
import Actions from '@/components/PageList/Actions'
import SingleActionsMixin from '../mixins/singleActions'
import ColumnsMixin from '../mixins/columns'
import SnapshotDetail from './Detail'
import SubSnapshotDetail from './SubSnapshotDetail'

export default {
  name: 'SnapshotInstanceSidePage',
  components: {
    SnapshotDetail,
    SubSnapshotDetail,
    Actions,
  },
  mixins: [SidePageMixin, WindowsMixin, ColumnsMixin, SingleActionsMixin],
  data () {
    return {
      detailTabs: [
        { label: this.$t('compute.text_238'), key: 'snapshot-detail' },
        { label: this.$t('table.title.sub_snapshot'), key: 'sub-snapshot-detail' },
        { label: this.$t('table.title.task'), key: 'task-drawer' },
        { label: this.$t('compute.text_240'), key: 'event-drawer' },
      ],
    }
  },
  computed: {
    listId () {
      switch (this.params.windowData.currentTab) {
        case 'event-drawer':
          return 'EventListForSnapshotInstanceSidePage'
        default:
          return ''
      }
    },
  },
}
</script>
