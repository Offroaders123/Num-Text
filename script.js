var numberedContainers = Array.from(document.querySelectorAll("[data-numbered-container]"));
numberedContainers.forEach(function(container){
  establishNumberedContainer(container);
});
function establishNumberedContainer(container){
  var lineCount = document.createElement("ol"), textarea = container.getElementsByTagName("textarea")[0];
  container.insertBefore(lineCount,textarea);
  updateLineCount(textarea);
  lineCount.addEventListener("click",function(){
    textarea.focus();
  });
  textarea.addEventListener("keydown",function(event){
    if ((event.ctrlKey || event.metaKey) && (event.key == "z" || event.key == "Z" || event.key == "y")){
      textarea.setAttribute("data-numbered-update",true);
    }
    if (event.key != "Enter" && event.key != "Backspace" && event.key != "Delete") return;
    var removedText = "", start = textarea.selectionStart, end = textarea.selectionEnd, singleCharacter = (start == end);
    if (!singleCharacter){
      removedText = textarea.value.substring(start,end);
    } else {
      if (event.key == "Backspace" && start != 0) removedText = textarea.value.substring(start - 1,start);
      if (event.key == "Delete" && start != textarea.value.length) removedText = textarea.value.substring(start,start + 1);
    }
    if (event.key == "Enter" || removedText.includes("\n")) textarea.setAttribute("data-numbered-update",true);
  });
  textarea.addEventListener("cut",function(){
    textarea.setAttribute("data-numbered-update",true);
  });
  textarea.addEventListener("paste",function(){
    textarea.setAttribute("data-numbered-update",true);
  });
  textarea.addEventListener("input",function(){
    if (!textarea.hasAttribute("data-numbered-update")) return;
    updateLineCount(textarea);
    textarea.removeAttribute("data-numbered-update");
  });
  textarea.addEventListener("scroll",function(){
    updateScrollPosition(textarea);
  },{ passive: true });
}
function updateLineCount(textarea){
  if (textarea.parentElement.hasAttribute("data-numbered-hidden")) return;
  var lineCount = textarea.parentElement.getElementsByTagName("ol")[0], previousCount = textarea.getAttribute("data-numbered-rows");
  if (!previousCount) previousCount = 0;
  var currentCount = textarea.value.split("\n").length, countDifference = currentCount - previousCount;
  if (countDifference == 0) return;
  for (i = 0; i < Math.abs(countDifference); i++){
    if (countDifference > 0) lineCount.appendChild(document.createElement("li"));
    if (countDifference < 0) lineCount.lastChild.remove();
  }
  textarea.setAttribute("data-numbered-rows",currentCount);
  updateScrollPosition(textarea);
}
function updateScrollPosition(textarea){
  var lineCount = textarea.parentElement.getElementsByTagName("ol")[0], scrollbarHeight = textarea.offsetHeight - textarea.clientHeight, paddingHeight = parseInt(window.getComputedStyle(lineCount).getPropertyValue("padding-top")), overflowOffset = parseInt(window.getComputedStyle(lineCount).getPropertyValue("--overflow-offset"));
  if (scrollbarHeight > 0){
    lineCount.style.setProperty("--overflow-offset",`${paddingHeight + scrollbarHeight}px`);
  } else {
    lineCount.style.setProperty("--overflow-offset",`${paddingHeight}px`);
  }
  lineCount.scrollTop = textarea.scrollTop;
}
function enableLineCount(textarea){
  textarea.parentElement.removeAttribute("data-numbered-hidden");
  updateLineCount(textarea);
}
function disableLineCount(textarea){
  textarea.parentElement.setAttribute("data-numbered-hidden",true);
}
function toggleLineCount(textarea){
  if (textarea.parentElement.hasAttribute("data-numbered-hidden")){
    enableLineCount(textarea);
  } else {
    disableLineCount(textarea);
  }
}