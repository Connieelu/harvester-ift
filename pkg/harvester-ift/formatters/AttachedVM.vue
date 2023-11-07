<script>
import { mapGetters } from 'vuex';
import { HCI as HCI_ANNOTATIONS } from '@pkg/harvester-ift/config/labels-annotations';

export default {
  props: {

    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    vms() {
      const nadOccupation = this.row.metadata.annotations[HCI_ANNOTATIONS.NAD_OCCUPATION] ? JSON.parse(this.row.metadata.annotations[HCI_ANNOTATIONS.NAD_OCCUPATION]) : '';

      if ( nadOccupation?.['attached-vm'] ) {
        return nadOccupation?.['attached-vm'];
      } else {
        return false;
      }
    },
    attachedVMLabels() {
      if (Array.isArray(this.vms) && this.vms.length > 1) {
        let vmsNames = '';

        this.vms.forEach((name, i) => {
          vmsNames += `&#8226; ${ name }<br>`;
        });

        return vmsNames;
      }

      return null;
    },
    mainVM() {
      const vms = this.vms;

      return vms[0];
    }
  }

};
</script>

<template>
  <span>
    <span>{{ mainVM }}</span><br>
    <span
      v-if="vms.length-1>0"
      v-tooltip.bottom="attachedVMLabels"
      class="plus-more"
    >{{ t('generic.plusMore', {n:vms.length-1}) }}</span>
  </span>
</template>
