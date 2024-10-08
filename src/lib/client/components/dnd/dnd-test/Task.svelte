<script>
  export let todo

  let isOver = false
  let isDragging = false

  function dragenter() {
    isOver = true
  }
  function dragleave() {
    isOver = false
  }
  function drop() {
    isOver = false
  }

  function dragstart() {
    isDragging = true
  }
  function dragend() {
    isDragging = false
  }
</script>

<li
  id={todo.id}
  draggable="true"
  class="relative m-2 cursor-grab bg-primary p-1"
  on:drag
  on:dragenter={dragenter}
  on:dragleave={dragleave}
  on:drop={drop}
  on:dragstart={dragstart}
  on:dragend={dragend}
  class:after:top-[-15px]={isOver}
  class:after:absolute={isOver}
  class:after:left-0={isOver}
  class:after:w-full={isOver}
  class:after:border-t-1={isOver}
  class:after:border-secondary={isOver}
  class:opacity-50={isDragging}
>
  {todo.text}
</li>
