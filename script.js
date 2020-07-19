var numberedContainers = Array.from(document.querySelectorAll("[data-numbered-container]"));
numberedContainers.forEach(function(container){
  var lineCount = document.createElement("ol");
  var textarea = container.getElementsByTagName("textarea")[0];
  container.insertBefore(lineCount,textarea);
  updateLineCount(textarea);
  lineCount.addEventListener("click",function(){
    textarea.focus();
  });
  textarea.addEventListener("input",function(){
    updateLineCount(textarea);
  });
  textarea.addEventListener("scroll",function(){
    var scrollbarHeight = textarea.offsetHeight - textarea.clientHeight;
    if (scrollbarHeight > 0){
      lineCount.style.paddingBottom = `${parseInt(window.getComputedStyle(lineCount).getPropertyValue("padding-top")) + scrollbarHeight}px`;
    } else {
      lineCount.style.removeProperty("padding-bottom");
    }
    lineCount.scrollTop = textarea.scrollTop;
  });
});
function updateLineCount(textarea){
  var lineCount = textarea.parentElement.getElementsByTagName("ol")[0];
  var previousCount = textarea.dataset.numberedRows;
  if (previousCount == undefined){
    previousCount = 0;
  }
  textarea.style.padding = 0;
  textarea.style.height = 0;
  var currentCount = Math.floor(parseInt(textarea.scrollHeight) / parseInt(window.getComputedStyle(textarea).getPropertyValue("line-height")));
  textarea.style.removeProperty("padding");
  textarea.style.removeProperty("height");
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
  textarea.dataset.numberedRows = currentCount;
}