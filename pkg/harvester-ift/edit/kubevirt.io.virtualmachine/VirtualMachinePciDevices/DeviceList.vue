<script>
import ResourceTable from '@shell/components/ResourceTable';
import { HCI, PRODUCT_NAME } from '../../../types';
import { STATE, SIMPLE_NAME } from '@shell/config/table-headers';
export default {
  name: 'ListPciDevices',

  components: { ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },

    allgpu: {
      type:     Array,
      required: true,
    },

    node: {
      type:     Array,
      required: true,
    },

  },
  async fetch() {
    // const inStore = this.$store.getters['currentProduct'].inStore;

    await this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.PCI_CLAIM });
  },

  data() {
    const isSingleProduct = this.$store.getters['isSingleProduct'];
    const headers = [
      { ...STATE },
      SIMPLE_NAME,
      {
        name:      'description',
        labelKey:  'tableHeaders.description',
        value:     'id',
        formatter: 'GpuDescription',
        sort:      ['status.description']
      },
      {
        name:     'node',
        labelKey: 'tableHeaders.node',
        value:    'status.nodeName',
        sort:     ['status.nodeName']
      },
      // {
      //   name:  'address',
      //   label: 'Address',
      //   value: 'status.address',
      //   sort:  ['status.address']
      // },
      // {
      //   name:  'vendorid',
      //   label: 'Vendor ID',
      //   value: 'status.vendorId',
      //   sort:  ['status.vendorId', 'status.deviceId']
      // },
      // {
      //   name:  'deviceid',
      //   label: 'Device ID',
      //   value: 'status.deviceId',
      //   sort:  ['status.deviceId', 'status.vendorId']
      // },

    ];

    if (!isSingleProduct) {
      headers.push( {
        name:  'claimed',
        label: 'Claimed By',
        value: 'passthroughClaim.userName',
        sort:  ['passthroughClaim.userName'],

      });
    }

    return { headers };
  },

  methods: {
    enableGroup(rows = []) {
      const iommuGroup = rows[0].status.iommuGroup;
      const groupRows = this.filterByGroup(iommuGroup);

      const row = groupRows[0];

      if (row) {
        row.enablePassthroughBulk(groupRows);
      }
    },
    disableGroup(rows = []) {
      const iommuGroup = rows[0].status.iommuGroup;
      const row = this.filterByGroup(iommuGroup);

      row.forEach((row) => {
        if (row.passthroughClaim) {
          row.disablePassthrough();
        }
      });
    },
    groupIsAllEnabled(rows = []) {
      return !rows.find((device) => !device.passthroughClaim);
    },
    filterByGroup(iommuGroup) {
      const gpuNode = [];

      this.node.forEach((node) => {
        if (node.metadata.labels['gpu.infortrend.com/vm-gpu-mode'] === 'true') {
          gpuNode.push(node.metadata.name);
        }
      });
      const filterPciDevices = this.allgpu.filter((device) => {
        return device.status.vendorId === '10de' && gpuNode.includes(device.status.nodeName) && device.status.iommuGroup === iommuGroup;
      }) || [];

      return filterPciDevices;
    }
  }
};
</script>

<template>
  <ResourceTable
    :headers="headers"
    :schema="schema"
    :rows="rows"
  >
    <template #group-by="{group}">
      <div
        :ref="group.key"
        v-trim-whitespace
        class="group-tab"
      >
        <!-- <button
          v-if="groupIsAllEnabled(group.rows)"
          type="button"
          class="btn btn-sm role-secondary mr-5"
          @click="e=>{disableGroup(group.rows); e.target.blur()}"
        >
          {{ t('harvester.pci.disableGroup') }}
        </button>
        <button
          v-else
          type="button"
          class="btn btn-sm role-secondary mr-5"
          @click="e=>{enableGroup(group.rows); e.target.blur()}"
        >
          {{ t('harvester.pci.enableGroup') }}
        </button> -->
        <span v-html="group.key" />
      </div>
    </template>
    <template #cell:claimed="{row}">
      <span v-if="row.isEnabled">{{ row.claimedBy }}</span>
      <span
        v-else
        class="text-muted"
      >&mdash;</span>
    </template>
  </ResourceTable>
</template>
