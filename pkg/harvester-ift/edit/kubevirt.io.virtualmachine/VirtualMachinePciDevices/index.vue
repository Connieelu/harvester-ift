<script>
import { _EDIT } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import { HCI, PRODUCT_NAME } from '../../../types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import CompatibilityMatrix from './CompatibilityMatrix';
import DeviceList from './DeviceList';

import remove from 'lodash/remove';
import { get, set } from '@shell/utils/object';

export default {
  name:       'VirtualMachinePCIDevices',
  components: {
    LabeledSelect,
    DeviceList,
    CompatibilityMatrix,
    Banner
  },
  props: {
    mode: {
      type:    String,
      default: _EDIT
    },
    // spec.template.spec
    value: {
      type:    Object,
      default: () => {}
    },

    vm: {
      type:    Object,
      default: () => {}
    }
  },

  async fetch() {
    const hash = {
      // claims fetched here so synchronous pciDevice model property works
      pciDevices: this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.PCI_DEVICE }),
      claims:     this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.PCI_CLAIM }),
      vms:        this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.VM }),
      node:       this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: 'node' })

    };

    const res = await allHash(hash);

    for (const key in res) {
      this[key] = res[key];
    }

    const selectedDevices = [];
    const oldFormatDevices = [];

    (this.value?.domain?.devices?.gpus || []).forEach(({ name, deviceName }) => {
      const checkName = (deviceName || '').split('/')?.[1];

      if (checkName && name.includes(checkName)) {
        oldFormatDevices.push(name);
      } else if (this.enabledDevices.find((device) => device?.metadata?.name === name)) {
        selectedDevices.push(name);
      }
    });

    if (oldFormatDevices.length > 0) {
      this.oldFormatDevices = oldFormatDevices;
    } else {
      this.selectedDevices = selectedDevices;
    }
  },

  data() {
    return {
      pciDevices:       [],
      claims:           [],
      vms:              [],
      node:             [],
      selectedDevices:  [],
      pciDeviceSchema:  this.$store.getters[`${ PRODUCT_NAME }/schemaFor`](HCI.PCI_DEVICE),
      showMatrix:       false,
      oldFormatDevices: [],
    };
  },

  watch: {
    selectedDevices(neu) {
      const formatted = neu.map((selectedDevice) => {
        const deviceCRD = this.enabledDevices.find((device) => device.metadata.name === selectedDevice);
        const deviceName = deviceCRD?.status?.resourceName;

        return {
          deviceName,
          name: deviceCRD?.metadata.name,
        };
      });

      set(this.value.domain.devices, 'gpus', formatted);
    }
  },

  computed: {
    // user can only select devices for whcih pci passthrough is enabled/claimed by them - determined by finding the associated passthrough CRD
    enabledDevices() {
      return this.filterByGroup.filter((device) => {
        return device.isEnabled && device.claimedByMe;
      }) || [];
    },

    // find devices in use by other VMs and sum the number of each device already in use
    devicesInUse() {
      const inUse = this.vms.reduce((inUse, vm) => {
        // dont count devices in this vm as 'disabled' if they're just being used in the vm currently being edited
        if (vm.metadata.name === this.vm?.metadata?.name) {
          return inUse;
        }
        const devices = get(vm, 'spec.template.spec.domain.devices.hostDevices') || [];

        devices.forEach((device) => {
          inUse[device.name] = { usedBy: [vm.metadata.name] };
        });

        return inUse;
      }, {});

      return inUse;
    },

    devicesByNode() {
      const out = {};

      this.enabledDevices.forEach((deviceCRD) => {
        const nodeName = deviceCRD.status?.nodeName;

        if (!out[nodeName]) {
          out[nodeName] = [deviceCRD];
        } else {
          out[nodeName].push(deviceCRD);
        }
      });

      return out;
    },

    // determine which nodes contain all devices selected
    compatibleNodes() {
      const out = [...Object.keys(this.devicesByNode)];

      this.selectedDevices.forEach((deviceUid) => {
        remove(out, (nodeName) => {
          const device = this.enabledDevices.find((deviceCRD) => deviceCRD.metadata.name === deviceUid);

          return device.status.nodeName !== nodeName;
        });
      });

      return out;
    },

    // Filter the first device of the GPU through the group
    filterByGroup() {
      const groupedData = {};
      const minItemGroup = [];
      const gpuNode = [];

      this.node.forEach((node) => {
        if (node.metadata.labels['gpu.infortrend.com/vm-gpu-mode'] === 'true') {
          gpuNode.push(node.metadata.name);
        }
      });

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

      const filterPciDevices = minItemGroup.filter((device) => {
        return gpuNode.includes(device.status.nodeName);
      }) || [];

      return filterPciDevices;
    },

    // format an array of available devices for the dropdown
    deviceOpts() {
      const filteredOptions = this.enabledDevices.filter((deviceCRD) => {
        if (this.selectedDevices.length > 0) {
          const selectedDevice = this.enabledDevices.find((device) => device.metadata.name === this.selectedDevices[0]);

          return !this.devicesInUse[deviceCRD?.metadata.name] && deviceCRD.status.nodeName === selectedDevice.status.nodeName;
        }

        return !this.devicesInUse[deviceCRD?.metadata.name];
      });

      return filteredOptions.map((deviceCRD) => {
        return {
          value:        deviceCRD?.metadata.name,
          label:        deviceCRD?.metadata.name,
          displayLabel: deviceCRD?.status?.resourceName,
        };
      });
    },

    oldFormatDevicesHTML() {
      return this.oldFormatDevices.map((device) => {
        return `<li>${ device }</li>`;
      }).join('');
    },
  },

  methods: {
    nodeNameFromUid(uid) {
      for (const deviceUid in this.uniqueDevices) {
        const nodes = this.uniqueDevices[deviceUid].nodes;
        const thisNode = nodes.find((node) => node.systemUUID === uid);

        if (thisNode) {
          return thisNode.name;
        }
      }
    },
  }
};
</script>

<template>
  <div>
    <div
      v-if="oldFormatDevices.length > 0"
      class="row"
    >
      <div class="col span-12">
        <Banner color="warning">
          <p v-html="t('harvester.pci.oldFormatDevices.help', {oldFormatDevicesHTML}, true)" />
        </Banner>
      </div>
    </div>
    <div v-else>
      <div class="row">
        <div class="col span-12">
          <Banner color="info">
            <t k="harvester.pci.howToUseDevice" />
          </Banner>
          <Banner
            v-if="selectedDevices.length > 0"
            color="info"
          >
            <t k="harvester.pci.deviceInTheSameHost" />
          </Banner>
        </div>
      </div>
      <template v-if="enabledDevices.length">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="selectedDevices"
              label="Available GPUs"
              searchable
              multiple
              taggable
              :options="deviceOpts"
              :mode="mode"
            >
              <template #option="option">
                <span>{{ option.value }} <span class="text-label">({{ option.displayLabel }})</span></span>
              </template>
            </LabeledSelect>
          </div>
        </div>
        <div
          v-if="compatibleNodes.length && selectedDevices.length"
          class="row"
        >
          <div class="col span-12 text-muted">
            Compatible hosts:
            <!-- eslint-disable-next-line vue/no-parsing-error -->
            <span
              v-for="(node, idx) in compatibleNodes"
              :key="node"
            >{{ node }}{{ idx &lt; compatibleNodes.length-1 ? ', ' : '' }}</span>
          </div>
        </div>
        <div
          v-else-if="selectedDevices.length"
          class="text-error"
        >
          {{ t('harvester.pci.impossibleSelection') }}
        </div>
        <!--<button
          type="button"
          class="btn btn-sm role-link pl-0"
          @click="e=>{showMatrix = !showMatrix; e.target.blur()}"
        >
          {{ showMatrix ? t('harvester.pci.hideCompatibility') : t('harvester.pci.showCompatibility') }}
        </button>-->
        <div
          v-if="showMatrix"
          class="row mt-20"
        >
          <div class="col span-12">
            <CompatibilityMatrix
              :enabled-devices="enabledDevices"
              :devices-by-node="devicesByNode"
              :devices-in-use="devicesInUse"
            />
          </div>
        </div>
      </template>
      <div class="row mt-20">
        <div class="col span-12">
          <DeviceList
            :allgpu="pciDevices"
            :node="node"
            :schema="pciDeviceSchema"
            :rows="filterByGroup"
            @submit.prevent
          />
        </div>
      </div>
    </div>
  </div>
</template>
