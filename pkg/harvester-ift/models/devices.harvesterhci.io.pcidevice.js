import SteveModel from '@shell/plugins/steve/steve-class';
import { escapeHtml } from '@shell/utils/string';
import { HCI, PRODUCT_NAME } from '../types';

const STATUS_DISPLAY = {
  enabled: {
    displayKey: 'generic.enabled',
    color:      'bg-success'
  },
  pending: {
    displayKey: 'generic.inProgress',
    color:      'bg-info'
  },
  disabled: {
    displayKey: 'generic.disabled',
    color:      'bg-warning'
  },
  error: {
    displayKey: 'generic.disabled',
    color:      'bg-warning'
  }
};

/**
 * Class representing PCI Device resource.
 * @extends SteveModal
 */
export default class PCIDevice extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    out.push(
      {
        action:     'enablePassthroughBulkGroup',
        enabled:    !this.isEnabling,
        icon:       'icon icon-fw icon-dot',
        label:      'Enable Passthrough',
        bulkable:   true,
        bulkAction: 'enablePassthroughBulkGroup'
      },
      {
        action:   'disablePassthroughGroup',
        enabled:  this.isEnabling && this.claimedByMe,
        icon:     'icon icon-fw icon-dot-open',
        label:    'Disable Passthrough',
        bulkable: true
      },
    );

    return out;
  }

  get canYaml() {
    return false;
  }

  get canDelete() {
    return false;
  }

  get passthroughClaim() {
    const passthroughClaims = this.$getters['all'](HCI.PCI_CLAIM) || [];

    return !!this.status && passthroughClaims.find((req) => req?.spec?.nodeName === this.status?.nodeName && req?.spec?.address === this.status?.address);
  }

  // this is an id for each 'type' of device - there may be multiple instances of device CRs
  get uniqueId() {
    return `${ this.status?.vendorId }:${ this.status?.deviceId }`;
  }

  get claimedBy() {
    return this.passthroughClaim?.spec?.userName;
  }

  get claimedByMe() {
    if (!this.passthroughClaim) {
      return false;
    }
    const isSingleProduct = this.$rootGetters['isSingleProduct'];
    let userName = 'admin';

    // if this is imported Harvester, there may be users other than admin
    if (!isSingleProduct) {
      userName = this.$rootGetters['auth/v3User']?.username;
    }

    return this.claimedBy === userName;
  }

  // isEnabled controls visibility in vm create page & ability to delete claim
  // isEnabling controls ability to add claim
  // there will be a brief period where isEnabling === true && isEnabled === false
  get isEnabled() {
    return !!this.passthroughClaim?.status?.passthroughEnabled;
  }

  get isEnabling() {
    return !!this.passthroughClaim;
  }

  // map status.passthroughEnabled to disabled/enabled & overwrite default dash colors
  get claimStatusDisplay() {
    if (!this.passthroughClaim) {
      return STATUS_DISPLAY.disabled;
    }
    if (this.isEnabled) {
      return STATUS_DISPLAY.enabled;
    }

    return STATUS_DISPLAY.pending;
  }

  get stateDisplay() {
    const t = this.$rootGetters['i18n/t'];

    return t(this.claimStatusDisplay.displayKey);
  }

  get stateBackground() {
    return this.claimStatusDisplay.color;
  }

  enablePassthroughBulkGroup(resources = this) {
    const iommuGroup = resources.status.iommuGroup;
    const rows = this.filterByGroup(iommuGroup);
    const row = rows[0];

    if (row) {
      row.enablePassthroughBulk(rows);
    }
  }

  disablePassthroughGroup(resources = this) {
    const iommuGroup = resources.status.iommuGroup;
    const rows = this.filterByGroup(iommuGroup);

    rows.forEach((row) => {
      if (row.passthroughClaim) {
        row.disablePassthrough();
      }
    });
  }

  // Filter the first device of the GPU through the group
  filterByGroup(iommuGroup) {
    const rows = this.$rootGetters[`${ PRODUCT_NAME }/all`](HCI.PCI_DEVICE);
    const node = this.$rootGetters[`${ PRODUCT_NAME }/all`]('node');
    const gpuNode = [];

    node.forEach((node) => {
      if (node.metadata.labels['gpu.infortrend.com/vm-gpu-mode'] === 'true') {
        gpuNode.push(node.metadata.name);
      }
    });
    const filterPciDevices = rows.filter((device) => {
      return device.status.vendorId === '10de' && gpuNode.includes(device.status.nodeName) && device.status.iommuGroup === iommuGroup;
    }) || [];

    return filterPciDevices;
  }

  // 'enable' passthrough creates the passthrough claim CRD -
  enablePassthroughBulk(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'EnablePassthrough'
    });
  }

  // 'disable' passthrough deletes claim
  // backend should return error if device is in use
  async disablePassthrough() {
    try {
      if (!this.claimedByMe) {
        throw new Error(this.$rootGetters['i18n/t']('harvester.pci.cantUnclaim', { name: escapeHtml(this.metadata.name) }));
      } else {
        await this.passthroughClaim.remove();
      }
    } catch (err) {
      this.$dispatch('growl/fromError', {
        title: this.$rootGetters['i18n/t']('harvester.pci.unclaimError', { name: escapeHtml(this.metadata.name) }),
        err,
      }, { root: true });
    }
  }

  // group device list by node
  get groupByNode() {
    const name = this.status?.nodeName || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.node', { name: escapeHtml(name) });
  }

  // group device list by unique device (same vendorid and deviceid)
  get groupByDevice() {
    return this.status?.description;
  }
}
