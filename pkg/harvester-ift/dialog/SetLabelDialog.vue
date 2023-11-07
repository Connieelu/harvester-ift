<script>
import { set } from '@shell/utils/object';
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
export default {
  name: 'CloneVMModal',

  components: { Card },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return { enabled: this.resources[0].metadata.labels['gpu.infortrend.com/vm-gpu-mode'] };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    close() {
      this.$emit('close');
    },

    create() {
      if (this.enabled !== 'true') {
        set(this.resources[0].metadata, 'labels', { 'gpu.infortrend.com/vm-gpu-mode': 'true' });
      } else {
        set(this.resources[0].metadata, 'labels', { 'gpu.infortrend.com/vm-gpu-mode': 'false' });
      }

      this.resources[0].save();
      this.close();
    }
  },
};
</script>

<template>
  <Card :show-highlight-border="false">
    <template #title>
      {{ t('harvester.modal.setLabel.title') }}
    </template>

    <template #body>
      <span
        v-if="enabled!=='true'"
        v-html="t('harvester.modal.setLabel.body.add')"
      />
      <span
        v-else
        v-html="t('harvester.modal.setLabel.body.remove')"
      />

      <span
        class="text-warning"
        v-html="t('harvester.modal.setLabel.body.warning')"
      />
    </template>

    <div
      slot="actions"
      class="actions"
    >
      <div class="buttons">
        <button
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>

        <button
          class="btn role-primary mr-10 "
          @click="create"
        >
          {{ t('harvester.modal.setLabel.action') }}
        </button>
      </div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.actions {
  width: 100%;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
