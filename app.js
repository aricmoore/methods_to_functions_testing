/*global jQuery, Handlebars, Router */
// jQuery(function($) {
  "use strict";

  Handlebars.registerHelper("eq", function(a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  var ENTER_KEY = 13;
  var ESCAPE_KEY = 27;

  function uuid() {
    /*jshint bitwise:false */
    var i, random;
    var uuid = "";

    for (i = 0; i < 32; i++) {
      random = (Math.random() * 16) | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += "-";
      }
      uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(
        16
      );
    }

    return uuid;
  }

  function pluralize(count, word) {
    return count === 1 ? word : word + "s";
  }

  function store(namespace, data) {
    if (arguments.length > 1) {
      return localStorage.setItem(namespace, JSON.stringify(data));
    } else {
      var store = localStorage.getItem(namespace);
      return (store && JSON.parse(store)) || [];
    }
  }

  var todos = store("todos-jquery");
  var filter;

  function Init() {
    bindEvents();

    new Router({
      "/:path": function(path) {
        filter = path;
        render();
      }
    }).init("/all");
  }

  var todoTemplate = Handlebars.compile($("#todo-template").html());

  function render() {
    var todosFiltered = getFilteredTodos();
    $("#todo-list").html(todoTemplate(todosFiltered));
    $("#main").toggle(todosFiltered.length > 0);
    $("#toggle-all").prop("checked", getActiveTodos().length === 0);
    renderFooter();
    $("#new-todo").focus();
    store("todos-jquery", todosFiltered);
  }

  var footerTemplate = Handlebars.compile($("#footer-template").html());

  function renderFooter() {
    var todoCount = todos.length;
    var activeTodoCount = getActiveTodos().length;
    var template = footerTemplate({
      activeTodoCount: activeTodoCount,
      activeTodoWord: pluralize(activeTodoCount, "item"),
      completedTodos: todoCount - activeTodoCount,
      filter: filter
    });

    $("#footer")
      .toggle(todoCount > 0)
      .html(template);
  }

  function bindEvents() {
    $("#new-todo").on("keyup", create);
    $("#toggle-all").on("change", toggleAll);
    $("#footer").on("click", "#clear-completed", destroyCompleted);
    $("#todo-list")
      .on("change", ".toggle", toggle)
      .on("dblclick", "label", edit)
      .on("keyup", ".edit", editKeyup)
      .on("focusout", ".edit", update)
      .on("click", ".destroy", destroy);
  }

  function getActiveTodos() {
    return todos.filter(function(todos) {
      return !todos.completed;
    });
  }

  function getCompletedTodos() {
    return todos.filter(function(todos) {
      return todos.completed;
    });
  }

  function getFilteredTodos() {
    if (filter === "active") {
      return getActiveTodos();
    }

    if (filter === "completed") {
      return getCompletedTodos();
    }

    return todos;
  }

  function create(e) {
    var $input = $(e.target);
    var val = $input.val().trim();

    if (e.which !== ENTER_KEY || !val) {
      return;
    }

    todos.push({
      id: uuid(),
      title: val,
      completed: false
    });

    $input.val("");

    render();
  }

  function toggleAll(e) {
    var isChecked = $(e.target).prop("checked");

    todos.forEach(function(todo) {
      todo.completed = isChecked;
    });

    render();
  }

  function toggle(e) {
    var i = indexFromEl(e.target);
    todos[i].completed = !todos[i].completed;
    render();
  }

  // accepts an element from inside the `.item` div and
  // returns the corresponding index in the `todos` array
  function indexFromEl(el) {
    var id = $(el)
      .closest("li")
      .data("id");
    var i = todos.length;

    while (i--) {
      if (todos[i].id === id) {
        return i;
      }
    }
  }

  function edit(e) {
    var $input = $(e.target)
      .closest("li")
      .addClass("editing")
      .find(".edit");
    $input.val($input.val()).focus();
  }

  function editKeyup(e) {
    if (e.which === ENTER_KEY) {
      e.target.blur();
    }

    if (e.which === ESCAPE_KEY) {
      $(e.target)
        .data("abort", true)
        .blur();
    }
  }

  function update(e) {
    var el = e.target;
    var $el = $(el);
    var val = $el.val().trim();

    if (!val) {
      destroy(e);
      return;
    }

    if ($el.data("abort")) {
      $el.data("abort", false);
    } else {
      todos[indexFromEl(el)].title = val;
    }

    render();
  }

  function destroyCompleted() {
    todos = getActiveTodos();
    filter = "all";
    render();
  }

  function destroy(e) {
    todos.splice(indexFromEl(e.target), 1);
    render();
  }

  Init();
// });

