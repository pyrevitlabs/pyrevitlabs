+++ 
date = 2024-12-02
draft = false 
title = 'Preflight Checks Hackathon 2024' 
[params]
  author = 'Jean-Marc Couffin'
+++ 

# 🎉 Preflight Checks Hackathon 2024

## Results
**Here is the list of the winners.**

3 Contestants, a bit lame to have had so little engagement, but that is a first, and the submissions were interesting, and some went over the top in terms of improvement of their original submission @tayOthman

### 🤩 Keep It Simple - $25 Gift Card or Equivalent
A check that is both simple and smart.
@andreasd811 you earned it. And I liked the fact this could scale eventually or become its own tool 👏

### 💻 Interesting Code Idea Elegance- $50 Gift Card or Equivalent
I changed a bit this category because… I can ;p
@KSalmon you earned it! The check makes sense, and while its complexity is average, it has interesting ideas in it. It would require some love, but this is a good first one

### 🚀 Most Advanced potential - $100 Gift Card or Equivalent
A complete check that pushes the boundaries of quality control.
@andreasd811 you earned it for its potential. I see the tool as an interesting validation tool.

### 🧑‍🚀💻⭐🤩 Best of the Best - $200 Gift Card or Equivalent
Simple, elegant, advanced, and maybe even smarter than the others—this entry might include a library that makes the check more reusable. Code improvements to the Preflight Checks Tools are also welcome.
@tayOthman the tool is interesting and your involvement was outstanding! Good job 🚀


Thanks for your engagement!

### Best judges 🚀
@sanzoghenzo you bring so much to the project with your knack and expert eyes for code quality/etiquette! Thank you man 🪂
@dosymep you are not bad too 😜


___

## What is a preflight check in pyRevit?
___

**Preflight Checks** are Python scripts processed through the **Preflight Checks tool** in the pyRevit toolbar.

It can take look like this:

{{< youtube NrEiK3RqsRU >}}

**Collect data from the actual documents or revit links, export the data collected for later use and comparison with historical data, ...**

The code for each check resides in the `checks` folder of each pyRevit extension.

You can find examples in the [Main Tools Extension](https://github.com/pyrevitlabs/pyRevit/tree/Preflight-Checks_Hackathon_2024/extensions/pyRevitTools.extension/checks).

On your computer, it is usually located at:

`%appdata%\pyRevit-Master\extensions\pyRevitTools.extension\checks`

## Goal
___

- Make people aware of the tool
- Make people use it
- Create badass preflight checks for the community
- Make it the one tool for QA QC, built by the community
- Modularize the checks
- Add more functionalities
- ...

## Conditions
___

### Who can enter?

- Simple: **Anyone**! Even pyRevit enthusiasts and contributors can participate (though they will be excluded from the jury 🤔).

### How to submit your entry?

- Create a PR against the [Preflight Checks Hackathon 2024 branch](https://github.com/pyrevitlabs/pyRevit/tree/Preflight-Checks_Hackathon_2024).
  - Advanced users can create their own fork and submit a PR against the upstream one.
  - Beginners can create a new check as follows:

{{< youtube vMbWabf4dTE >}}

  - If you’re unsure about the process, send your code to hello@pyrevitlab.io with your name, and we’ll take care of it.
  
- Show off your work on the forum in the [Tools - Preflight Checks Hackathon Category](https://discourse.pyrevitlabs.io/c/tools/hackathon-preflight-checks-2024/13).

### Timeline

⚠️ The deadline for submissions is **November 1st, 2024**.

### Categories & Prizes

**All relevant entries will be added to the official pyRevit preflight checks.**

- 🤩 **Keep It Simple** - $25 Gift Card or Equivalent

  A check that is both simple and smart.

- 💻 **Code Elegance** - $50 Gift Card or Equivalent

  Code that is either artistically elegant or highly Pythonic.

- 🚀 **Most Advanced** - $100 Gift Card or Equivalent

  A complete check that pushes the boundaries of quality control.

- 🧑‍🚀💻⭐ **Best of the Best** - $200 Gift Card or Equivalent

  Simple, elegant, advanced, and maybe even smarter than the others—this entry might include a library that makes the check more reusable. Code improvements to the Preflight Checks Tools are also welcome.

### Jury

- Ehsan, Jean-Marc, AndreaG, and Dosymep, plus others willing to participate in the evaluation process.

## How to create a preflight check?
___

1. Understand the structure; see the explanation below.
2. Use the template.
3. Try to use [charts](https://pyrevitlabs.notion.site/Visualizing-Data-fd778a0b67354ff581aa340619b87803#2c9df15f46874261b3f82b0602e092e2) to make your data look good.

### Structure

- Boilerplate
- Document declaration
- Definitions of all the data you are collecting in the Revit models
- Main definition calling all the previous ones, organizing the data, and making the output look good
- Class with pre- and post-definitions in case you need to clean up after the preflight checks
  - It contains the description of what your preflight check does
  - Its title
  - Its author
  - The `startTest` method that calls the `check_model` definition

### Template

The file needs to be named: `relevantName-**check.py**`, with the last part being the most important, as the parser looks for `check.py` in the folder.

> Boilerplate

```python
# -*- coding: UTF-8 -*-
from pyrevit import script, revit, DB, DOCS
from pyrevit.preflight import PreflightTestCase

doc = DOCS.doc
```

>🔦 Here, each definition collects info about specific Revit elements. Sample definitions to collect data about grids 👇
  
```python
def grids_collector(document=doc):
    grids = DB.FilteredElementCollector(document).OfCategory(DB.BuiltInCategory.OST_Grids).WhereElementIsNotElementType()
    return grids


def grids_count(document=doc):
    grids = grids_collector(document)
    count = grids.GetElementCount()
    return count


def grids_names(document=doc):
    grids = grids_collector(document)
    grids_names = []
    for grid in grids:
        grids_names.append(grid.Name)
    return grids_names


def grids_types(document=doc):
    grids = grids_collector(document)
    grids_types = []
    for grid in grids:
        grid_type = document.GetElement(grid.GetTypeId())
        # grid_type = grid.get_Parameter(DB.BuiltInParameter.ELEM_TYPE_PARAM).AsElement()
        grids_types.append(grid_type.get_Parameter(DB.BuiltInParameter.SYMBOL_NAME_PARAM).AsString())
    return grids_types


def grids_pinned(document=doc):
    grids = grids_collector(document)
    pinned_grids = []
    for grid in grids:
        pinned_grids.append(grid.Pinned)
    return pinned_grids


def grids_scoped(document=doc):
    grids = grids_collector(document)
    scoped_grids = []
    for grid in grids:
        scope = grid.get_Parameter(DB.BuiltInParameter.DATUM_VOLUME_OF_INTEREST).AsElementId()
        scope = document.GetElement(scope)
        if scope:
            scoped_grids.append(scope.Name)
        else:
            scoped_grids.append("None")
    return scoped_grids
```

>Main definition where elements data is organized and where you make it look good
  
```python
def check_model(document = doc):
    output = script.get_output()
    output.close_others()
    output.print_md("# Grids Data Lister")
    count = grids_count(document)
    output.print_md("## Number of grids: {0}".format(count))
    names = grids_names(document) # [1,2,3,4]
    types = grids_types(document) # [bubble, bubble, bubble, bubble]
    pinned = grids_pinned(document) # [True, False, True, False]
    scoper = grids_scoped(document) # [Name of scope, Name of scope, Name of scope, Name of scope]
    # 🔦 Here, we output the data in a table but you could use the charts modules to get better looking dashboard like in the https://github.com/pyrevitlabs/pyRevit/blob/Preflight-Checks_Hackathon_2024/extensions/pyRevitTools.extension/checks/modelchecker_check.py
    output.print_table(table_data=zip(names, types, pinned, scoper), title="Grids", columns=["Name", "Type", "Pinned", "Scope Box"])
```

>Main Class

```python
class ModelChecker(PreflightTestCase):

    #🔦 This will be your check's description in the preflight checks UI 👇

    """
    List grids, if they are pinned, scoped boxed, or named

    This QC tools returns you with the following data:
        Grids count, name, type, pinned status

    """
    #🔦 This will be your check's title in the preflight checks UI 👇
    name = "Grids Data Lister"
    author = "Jean-Marc Couffin"


    def startTest(self, doc):
        #🔦 This is where you call the check_model definition 👇
        checkModel(doc)

```

## FAQ
___

- **Where to ask for help?**

  on the [pyRevit forum](https://discourse.pyrevitlabs.io/)

- **What is the story behind the preflight checks tool?**

  David Vadkerti, Ehsan and Jean-Marc converged when Jean-Marc noticed David Vadkerti [Model Checker tool](https://bitbucket.org/davidvadkerti/customtools/src/master/CustomTools.tab/Batch.panel/Model%20checker.splitpushbutton/ModelChecker.pushbutton/script.py), they brought it together with Ehsan to make the core structure of the actual preflight checks tool in Nov 8, 2020
  
