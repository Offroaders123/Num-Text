var numberedTextareas = Array.from(document.querySelectorAll("[data-line-numbered]"));
numberedTextareas.forEach(function(textarea){
  var container = document.createElement("span");
  var lineCount = document.createElement("ol");
  textarea.parentElement.insertBefore(container,textarea);
  container.appendChild(textarea);
  container.insertBefore(lineCount,textarea);
  textarea.removeAttribute("data-enable-line-numbers");
  container.classList.add("line-numbered");
  updateLineCount();
  lineCount.addEventListener("click",function(){
    textarea.focus();
  });
  textarea.addEventListener("input",updateLineCount);
  textarea.addEventListener("scroll",function(){
    var scrollbarHeight = textarea.offsetHeight - textarea.clientHeight;
    if (scrollbarHeight > 0){
      lineCount.style.paddingBottom = `${parseInt(window.getComputedStyle(lineCount).getPropertyValue("padding-bottom")) + scrollbarHeight}px`;
    } else {
      lineCount.style.removeProperty("padding-bottom");
    }
    lineCount.scrollTop = textarea.scrollTop;
  });
  function updateLineCount(){
    var previousCount = textarea.dataset.rows;
    if (previousCount == undefined){
      previousCount = 0;
    }
    var currentCount = textarea.value.split("\n").length;
    var countDifference = currentCount - previousCount;
    if (countDifference != 0){
      for (i = 0; i < Math.abs(countDifference); i++){
        if (countDifference > 0){
          lineCount.appendChild(document.createElement("li"));
        }
        if (countDifference < 0){
          lineCount.lastChild.remove();
        }
      }
    }
    textarea.dataset.rows = currentCount;
  }
});