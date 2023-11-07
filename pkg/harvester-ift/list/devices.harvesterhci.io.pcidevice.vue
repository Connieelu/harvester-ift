<script>
import { SCHEMA } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading';
import MessageLink from '@shell/components/MessageLink';
import DeviceList from '../edit/kubevirt.io.virtualmachine/VirtualMachinePciDevices/DeviceList';
import { HCI, PRODUCT_NAME } from '../types';

const schema = {
  id:         HCI.PCI_DEVICE,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.PCI_DEVICE,
    namespaced: false
  },
  metadata: { name: HCI.PCI_DEVICE },
};

export default {
  name: 'ListPciDevicePage',

  components: {
    Banner, DeviceList, Loading, MessageLink
  },

  async fetch() {
    // const inStore = this.$store.getters['currentProduct'].inStore;

    this.hasSchema = this.$store.getters[`${ PRODUCT_NAME }/schemaFor`](HCI.PCI_DEVICE);
    // this.hasAddonSchema = this.$store.getters[`${ PRODUCT_NAME }/schemaFor`](HCI.ADD_ONS);

    if (this.hasSchema) {
      try {
        // const inStore = this.$store.getters['currentProduct'].inStore;

        const hash = await allHash({
          pcidevice: this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.PCI_DEVICE }),
          addons:    this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.ADD_ONS }),
          node:      this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: 'node' })
        });
        const res = await allHash(hash);

        this.node = res.node;
        this.pciDevices = res.pcidevice;

        // this.enabledPCI = hash.addons.find(addon => addon.name === 'pcidevices-controller')?.spec?.enabled === true;
        this.enabledPCI = true;
        this.$store.dispatch('type-map/configureType', { match: HCI.PCI_DEVICE, isCreatable: this.enabledPCI });
      } catch (e) {}
    }
  },

  data() {
    return {
      enabledPCI: false,
      hasSchema:  false,
      to:         `${ HCI.ADD_ONS }/harvester-system/pcidevices-controller?mode=edit`,
      node:       [],
      pciDevices: [],
    };
  },

  computed: {
    schema() {
      return schema;
    },

    // Filter the first device of the GPU through the group
    filterByGroup() {
      const groupedData = {};
      const minItemGroup = [];

      // Sort by group
      this.pciDevices.forEach((item) => {
        if (item.status.vendorId === '10de') {
          if (!groupedData[item.status.iommuGroup]) {
            groupedData[item.status.iommuGroup] = [];
          }

          groupedData[item.status.iommuGroup].push(item);
        }
      });
      for (const group in groupedData) {
        const groupItems = groupedData[group];
        const minItem = groupItems.reduce((min, item) => (item.status.address < min.status.address ? item : min), groupItems[0]);

        minItemGroup.push(minItem);
      }

      return minItemGroup;
    },

    rows() {
      const gpuNode = [];

      this.node.forEach((node) => {
        if (node.metadata.labels['gpu.infortrend.com/vm-gpu-mode'] === 'true') {
          gpuNode.push(node.metadata.name);
        }
      });
      const filterPciDevices = this.filterByGroup.filter((device) => {
        return gpuNode.includes(device.status.nodeName);
      }) || [];

      return filterPciDevices;
    }
  },

  typeDisplay() {
    return this.$store.getters['type-map/labelFor'](schema, 99);
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <!-- <div v-else-if="!hasAddonSchema">
    <Banner color="warning">
      {{ t('harvester.pci.noPCIPermission') }}
    </Banner>
  </div> -->
  <DeviceList
    v-else-if="hasSchema && enabledPCI"
    :allgpu="pciDevices"
    :node="node"
    :rows="rows"
    :schema="schema"
  />
  <div v-else>
    <Banner color="warning">
      <MessageLink
        :to="to"
        prefix-label="harvester.pci.goSetting.prefix"
        middle-label="harvester.pci.goSetting.middle"
        suffix-label="harvester.pci.goSetting.suffix"
      />
    </Banner>
  </div>
</template>
