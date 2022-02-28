<script lang="ts">
  import { Router, Route } from "svelte-navigator";
  import Death from "@/component/Death.svelte";
  import Join from "@/component/Join.svelte";
  import { socket } from "@/lib/ws";

  socket.on("connect", () => {
    console.log("connected :)");
  });
  
</script>

<svelte:head>
  <title>Deathcount</title>
  <style lang="scss">
    @use "./scss";
  </style>
</svelte:head>

<Router>
  <main class="main">
    <Route path="/" component={Join} />
    <Route path="/:channel" component={Death} />
  </main>
</Router>

<style lang="scss">
  .main {
    display: grid;
    place-content: center;
  }
</style>
