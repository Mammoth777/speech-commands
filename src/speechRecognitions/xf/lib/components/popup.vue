<script setup>
import { onMounted, ref } from "vue";
const show = ref(false);

const props = defineProps({
  removeNode: Function,
})

onMounted(() => {
  show.value = true;
});
const close = () => {
  if (show.value) {
    //动画结束后关闭弹窗
    show.value = false;
    setTimeout(() => {
      // 动画结束后移除元素
      props.removeNode();
    }, 500);
  }
};
</script>

<template>
  <div class="">
    <transition name="pop">
      <div class="pop-wrap" v-if="show">
        <div class="mask" @click="close"></div>
        <div class="pop-content">
          <div class="img-div">
            <img src="../assets/voice.png" alt="">
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.pop-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
.mask {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  transition: all 0.5s;
}
.pop-enter-active,
.pop-leave-active {
  /* 时长需要与各个子元素（maske、pop-content）动画时长最长的相等 */
  transition: all 0.5s;
}
.pop-content {
  background: #fff;
  border-radius: 10px;
  width: 400px;
  height: 120px;
  position: absolute;
  right: 24px;
  top: 24px;
  transition: all 0.5s;
}
.img-div {
  width: 64px;
  height: 64px;
  display: flex;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #0077fa5c;
}
.img-div img {
  margin: auto;
}
</style>


