<template>
  <div class="card">
    <h3>{{ asset.AssetName }}</h3>
    <p>ประเภท: {{ asset.CategoryName }}</p>
    <p>Serial: {{ asset.SerialNumber || '-' }}</p>
    <p>สถานที่เก็บ: {{ asset.Location || '-' }}</p>
    <p><span class="badge">{{ asset.Status }}</span></p>
    <button v-if="asset.Status==='Available' && isMember" @click="$emit('borrow', asset)">ขอยืม</button>
  </div>
</template>

<script setup>
defineProps({ asset: Object, isMember: Boolean });
defineEmits(['borrow']);
</script>
