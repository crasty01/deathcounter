<script lang="ts">
  import { navigate } from 'svelte-navigator';

  let value = 'cdubya719';

  const handleJoin = () => {
    navigate(value, { replace: false });
  };
</script>

<div class="form">
  <div class="input_group">
    <label for="channel">channel name:</label>
    <div class="wrapper">
      <div class="input">
        <input
          type="text"
          id="channel"
          bind:value
        />
      </div>
    </div>
  </div>
  <button
    class="button button--dark button--wide"
    on:click={handleJoin}>join</button
  >
</div>

<style lang="scss">
  .form {
    display: grid;
    gap: 1rem;
  }

  .input_group {
    display: flex;
    align-items: flex-start;
    gap: calc(var(--base-size) * 1);
    flex-direction: column;

    & > label {
      word-wrap: normal;
      white-space: nowrap;
    }

    & .wrapper {
      display: flex;
      align-items: center;
      gap: calc(var(--base-size) * 4);

      & .input {
        display: flex;
        align-items: center;
        background-color: var(--clr-dark-050);
        border-radius: var(--border-radius);
        max-width: 100%;

        & > input {
          all: unset;
          display: block;
          width: 100%;
          background-color: var(--clr-dark-050);
          border-top-left-radius: var(--border-radius);
          border-bottom-left-radius: var(--border-radius);
          padding: var(--base-size) calc(var(--base-size) * 2);
          border: solid var(--border-width);
          border-color: var(--clr-dark-050);
        }
      }
    }
  }
</style>
