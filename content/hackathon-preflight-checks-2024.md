# 🎉 Preflight Checks Hackathon 2024



## What is a preflight check in pyRevit?
___

Prelflight Checks are python scripts parsed through the preflight checks tools in the pyRevit toolbar.

The code for each check lives in the checks folder of each pyRevit extension 
[Main Tools Extension](https://github.com/pyrevitlabs/pyRevit/tree/Preflight-Checks_Hackathon_2024/extensions/pyRevitTools.extension/checks)


On your conmputer, it will usually live in `%appdata%\pyRevit-Master\extensions\pyRevitTools.extension\checks`

## Conditions
___

### Who can enter?

- Simple: **Anyone** even pyRevit geeks and contributors (but they will be excluded from the jury 🤔)

### How to submit your entry?

- Create a PR against the [preflight checks hackathon 2024 branch](https://github.com/pyrevitlabs/pyRevit/tree/Preflight-Checks_Hackathon_2024)
  - Advanced users should know about it, make their own fork and PR against the upstream one
  - NOOB could create a new check like so:

    <details>
    <summary>Explaination</summary>
  
      ![pfchckthn](https://github.com/user-attachments/assets/d33680aa-6335-4529-a1b6-c3abfdef7c47)

    </details>

  - If you have no idea what we are talking about, send your code to hello@pyrevitlab.io with your name, and we will take care of it.
- Show off on the forum in the [Tools - Preflight Checks Hackathon Category](https://discourse.pyrevitlabs.io/c/tools/hackathon-preflight-checks-2024/13)


### Timeline

⚠️ Deadline for submission is**November 1st, 2024**

### Categories & Prizes

**All relevant entry will be added to the pyRevit official preflight checks**

- 🤩 **Keep It Simple** - 25$ Gift Card or Equivalent

A check that is both simple and smart.

- 💻 **Code Elegance** - 50$ Gift Card or Equivalent

It can be an artistic code or the most pythonic one

- 🚀 **Most Advanced** - 100$ Gift Card or Equivalent

A complete check that push the boundaries of quality control

- 🧑‍🚀💻⭐ **Best of the best** - 200$ Gift Card or Equivalent

Simple, Elegant, Advanced and maybe smarter that the other, the contestant created a library for its check making them more reusable.
Code improvements to the Preflight Checks Tools are welcomed

### Jury

- Ehsan, Jean-Marc, AndreaG and Dosymep + others willing to participate in the evaluation process


## How to make one?
___

1. Understand the structure, see the explaination below
2. Use the template
3. Try to use the [charts](https://pyrevitlabs.notion.site/Visualizing-Data-fd778a0b67354ff581aa340619b87803#2c9df15f46874261b3f82b0602e092e2) to make your data look good

### Structure

- boiler plate
- document declaration
- definitions of all the data you are collecting in the revit models
- main definition calling all the previous ones, and ordering and making the data output look good.
- Class with pre and post definition in cas you need to clean up after the preflight checks.
  - It contains the description of what your preflight checks does
  - its title
  - its author
  - the startTest def that calls the check-model definition 

### Template

the file needs to be named: releveanName-**check.py**
The last part being the most important one, as the parser looks for the check.py in the folder.


>Boiler plate

```python
# -*- coding: UTF-8 -*-
from pyrevit import script, revit, DB, DOCS
from pyrevit.preflight import PreflightTestCase

doc = DOCS.doc
```

>🔦 Here, each definition collects info about specific Revit elements. Sample definitions to collect data about grids 👇
  
```python
def grids_collector(document):
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
def check_model(doc, output):
    output = script.get_output()
    output.close_others()
    output.print_md("# Grids Data Lister")
    count = grids_count()
    output.print_md("## Number of grids: {0}".format(count))
    names = grids_names() # [1,2,3,4]
    types = grids_types() # [bubble, bubble, bubble, bubble]
    pinned = grids_pinned() # [True, False, True, False]
    scoper = grids_scoped() # [Name of scope, Name of scope, Name of scope, Name of scope]
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

    def setUp(self, doc, output):
        pass

    def startTest(self, doc, output):
        #🔦 This is where you call the check_model definition 👇
        checkModel(doc, output)


    def tearDown(self, doc, output):
        pass

    def doCleanups(self, doc, output):
        pass
```

  
