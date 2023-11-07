import Vue from 'vue';
import { clone } from '@shell/utils/object';
import { HCI as HCI_ANNOTATIONS } from '@pkg/harvester-ift/config/labels-annotations';
import NetworkAttachmentDef from '@shell/models/k8s.cni.cncf.io.networkattachmentdefinition';
import { HCI, PRODUCT_NAME } from '../../types';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

const NOT_READY = 'Not Ready';

export default class HarvesterNetworkAttachmentDef extends NetworkAttachmentDef {
  applyDefaults() {
    // const spec = this.spec || {
    //   config: JSON.stringify({
    //     cniVersion:  '0.3.1',
    //     name:        '',
    //     type:        'bridge',
    //     bridge:      '',
    //     promiscMode: true,
    //     vlan:        '',
    //     ipam:        {}
    //   })
    // };
    const spec = this.spec || {
      config: JSON.stringify({
        cniVersion: '0.3.1',
        name:       '',
        type:       'macvtap',
        mtu:        1500,
      })
    };

    Vue.set(this, 'spec', spec);
  }

  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-resource`,
      params: {
        product:  HARVESTER_PRODUCT,
        cluster:  this.$rootGetters['clusterId'],
        resource: this.type,
      },
    };
  }

  get doneRoute() {
    return this.listLocation.name;
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.NETWORK_ATTACHMENT;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource-namespace-id`;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.NETWORK_ATTACHMENT;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.NETWORK_ATTACHMENT }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get inStore() {
    return PRODUCT_NAME;
  }

  get clusterNetworkResource() {
    const clusterNetworks = this.$rootGetters[`${ this.inStore }/all`](HCI.CLUSTER_NETWORK);

    return clusterNetworks.find((c) => c.id === this.clusterNetwork);
  }

  get clusterNetworkErrorMessage() {
    if (!this.clusterNetworkResource) {
      return this.t('harvester.clusterNetwork.notExist', { clusterNetwork: this.clusterNetwork });
    } else if (!this.clusterNetworkResource.isReady) {
      return this.t('harvester.clusterNetwork.notReady', { clusterNetwork: this.clusterNetwork });
    } else {
      return '';
    }
  }

  get stateDisplay() {
    // if (this.clusterNetworkErrorMessage) {
    //   return NOT_READY;
    // }

    return super.stateDisplay;
  }

  get stateBackground() {
    if (this.stateDisplay === NOT_READY) {
      return 'bg-warning';
    }

    return super.stateBackground;
  }

  get isNotReady() {
    return this.clusterNetworkErrorMessage;
  }

  get preventDeletionMessage() {
    const nadOccupation = this.metadata.annotations[HCI_ANNOTATIONS.NAD_OCCUPATION] ? JSON.parse(this.metadata.annotations[HCI_ANNOTATIONS.NAD_OCCUPATION]) : '';

    if (nadOccupation?.status === 'InUse') {
      return 'This VM Networks is In-use.';
    } else {
      return false;
    }
  }
}
