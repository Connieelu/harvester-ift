<script>

export default {
  props: {
    row: {
      type:     Object,
      required: true
    }
  },

  computed: {
    GpuDescription() {
      const descriptionString = this.row.status.description;
      const parts = descriptionString.split(':');

      if (parts.length >= 2) {
        const textAfterColon = parts.slice(1).join(':').trim();

        return textAfterColon;
      } else {
        return descriptionString;
      }
    },
  },
};
</script>

<template>
  <div>
    {{ GpuDescription }}
  </div>
</template>
