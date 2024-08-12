+++ 
date = 2024-08-12 
draft = false 
title = 'pyRevit in Revit 2025 - Dev Progress' 
weight = 10 
[params]
  author = 'Jean-Marc Couffin'
+++ 


Here is a teaser of the progress made by https://github.com/dosymep on the port of pyRevit to Revit 2025
The work involved is huge

{{< youtube QAeD0aEYl9I >}}


No ETA, don't ask. 
IronPython based code works fine, 
CCompiler is messing with us, and lots of others dependencies needs some love, mods and refactoring.


we are almost there, you can try a working version (except for some bugs with the output window and the cpython engine path) using this WIP installers
https://github.com/dosymep/pyRevit/actions/runs/10347422948
