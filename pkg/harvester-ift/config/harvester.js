import { PVC, CONFIG_MAP } from '@shell/config/types';
import { HCI } from '../types';
import {
  STATE,
  NAME as NAME_COL,
  AGE,
  NAMESPACE as NAMESPACE_COL
} from '@shell/config/table-headers';
import {
  IMAGE_DOWNLOAD_SIZE,
  IMAGE_PROGRESS,
  OS_TYPE
} from './table-headers';

export const PRODUCT_NAME = 'virtualization';

export function init($plugin, store) {
  const {
    product,
    basicType,
    weightType,
    headers,
    configureType,
    mapType,
    virtualType,
  } = $plugin.DSL(store, PRODUCT_NAME);

  product({
    removable:           false,
    inExplorer:          true,
    showNamespaceFilter: true,
    weight:              97,
  });

  configureType(HCI.VM, {
    customRoute: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        cluster:  'local',
        resource: HCI.VM
      }
    }
  });

  configureType(HCI.SSH, {
    customRoute: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        cluster:  'local',
        resource: HCI.SSH
      }
    }
  });

  headers(HCI.IMAGE, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    OS_TYPE,
    IMAGE_PROGRESS,
    IMAGE_DOWNLOAD_SIZE,
    AGE
  ]);

  configureType(HCI.IMAGE, {
    customRoute: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        cluster:  'local',
        resource: HCI.IMAGE
      }
    }
  });
  mapType(HCI.IMAGE, 'Images');

  configureType(HCI.VOLUME, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.VOLUME }
    },
    resource:       PVC,
    resourceDetail: HCI.VOLUME,
    resourceEdit:   HCI.VOLUME,
  });
  virtualType({
    labelKey:   'harvester.volume.label',
    ifHaveType: PVC,
    name:       HCI.VOLUME,
    namespaced: true,
    weight:     199,
    icon:       'folder',
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.VOLUME }
    },
    exact: false
  });
  mapType(PVC, 'PersistentVolumeClaims');

  configureType(HCI.NETWORK_ATTACHMENT, {
    customRoute: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        cluster:  'local',
        resource: HCI.NETWORK_ATTACHMENT
      }
    }
  });
  mapType(HCI.NETWORK_ATTACHMENT, 'VM Networks');

  configureType(HCI.VM_SNAPSHOT, {
    showListMasthead: false,
    customRoute:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        cluster:  'local',
        resource: HCI.VM_SNAPSHOT
      }
    }
  });
  mapType(HCI.VM_SNAPSHOT, 'VM Snapshots');

  configureType(HCI.PCI_DEVICE, {
    hiddenNamespaceGroupButton: true,
    isCreatable:                false,
    listGroups:                 [
      // {
      //   icon:       'icon-list-grouped',
      //   value:      'description',
      //   field:      'groupByDevice',
      //   hideColumn: 'description',
      //   tooltipKey: 'resourceTable.groupBy.device'
      // },
      {
        icon:       'icon-cluster',
        value:      'node',
        field:      'groupByNode',
        hideColumn: 'node',
        tooltipKey: 'resourceTable.groupBy.node'
      }
    ],
    customRoute: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        cluster:  'local',
        resource: HCI.PCI_DEVICE
      }
    }
  });

  configureType(HCI.VM_VERSION, {
    customRoute: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: {
        product:  PRODUCT_NAME,
        cluster:  'local',
        resource: HCI.VM_VERSION
      }
    }
  });

  configureType(HCI.CLOUD_TEMPLATE, {
    location: {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.CLOUD_TEMPLATE }
    },
    resource:       CONFIG_MAP,
    resourceDetail: HCI.CLOUD_TEMPLATE,
    resourceEdit:   HCI.CLOUD_TEMPLATE
  });
  virtualType({
    labelKey:   'harvester.cloudTemplate.label',
    name:       HCI.CLOUD_TEMPLATE,
    icon:       'folder',
    namespaced: true,
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-resource`,
      params: { resource: HCI.CLOUD_TEMPLATE }
    },
    exact: false
  });

  basicType([HCI.VM, HCI.SSH, HCI.IMAGE, HCI.VOLUME, HCI.NETWORK_ATTACHMENT, HCI.VM_SNAPSHOT, HCI.PCI_DEVICE, HCI.VM_VERSION, HCI.CLOUD_TEMPLATE]);

  weightType(HCI.VM, 200, true);
  // weightType(HCI.VOLUME, 199, true);
  weightType(HCI.IMAGE, 198, true);
  weightType(HCI.NETWORK_ATTACHMENT, 197, true);
  weightType(HCI.SSH, 196, true);
  weightType(HCI.VM_SNAPSHOT, 195, true);
  weightType(HCI.PCI_DEVICE, 194, true);
  weightType(HCI.VM_VERSION, 193, true);
  weightType(HCI.CLOUD_TEMPLATE, 193, true);
}
