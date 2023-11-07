// definition of a "blank cluster" in Rancher Dashboard
// import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateHarvesterResource from '../pages/c/_cluster/_resource/create.vue';
import ListHarvesterResource from '../pages/c/_cluster/_resource/index.vue';
import ViewHarvesterNsResource from '../pages/c/_cluster/_resource/_namespace/_id.vue';
import ViewHarvesterResource from '../pages/c/_cluster/_resource/_id.vue';
import HarvesterConsoleSerial from '../pages/c/_cluster/console/_uid/serial.vue';
import HarvesterConsoleVnc from '../pages/c/_cluster/console/_uid/vnc.vue';
// import { PRODUCT_NAME } from '../types';
const PRODUCT_NAME = 'virtualization';
// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used

const routes = [

  // the following routes cover the "resource page"
  // registering routes for list/edit/create views
  {
    name:      `${ PRODUCT_NAME }-c-cluster-console-uid-serial`,
    path:      `/:product/c/:cluster/console/:uid/serial`,
    component: HarvesterConsoleSerial,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-console-uid-vnc`,
    path:      `/:product/c/:cluster/console/:uid/vnc`,
    component: HarvesterConsoleVnc,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource`,
    path:      `/:product/c/:cluster/:resource`,
    component: ListHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-create`,
    path:      `/:product/c/:cluster/:resource/create`,
    component: CreateHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-id`,
    path:      `/:product/c/:cluster/:resource/:id`,
    component: ViewHarvesterResource,
  }, {
    name:      `${ PRODUCT_NAME }-c-cluster-resource-namespace-id`,
    path:      `/:product/c/:cluster/:resource/:namespace/:id`,
    component: ViewHarvesterNsResource,
  },

];

export default routes;
