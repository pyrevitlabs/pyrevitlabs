![]()


# Preflight Checks Hackathon

## What is a preflight check in pyRevit?

Prelflight Checks are python scripts parsed through the preflight checks tools in the pyRevit toolbar.

The code for each check lives in the checks folder of each pyRevit extension: https://github.com/pyrevitlabs/pyRevit/tree/Preflight-Checks_Hackathon_2024/extensions/pyRevitTools.extension/checks

On your conmputer, it will usually live in %appdata%\pyRevit-Master\extensions\pyRevitTools.extension\checks

## How to make one?

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
<details>
  <summary>Boiler plate</summary>
  
```python
# -*- coding: UTF-8 -*-
from pyrevit import script, revit, DB, DOCS
from pyrevit.preflight import PreflightTestCase

doc = DOCS.doc
```
</details>



<details>
  <summary>🔦 Here, each definition collects info about specific Revit elements. Sample definitions to collect data about grids 👇</summary>
  
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
</details>

<details>
  <summary>Main definition where elements data is organized and where you make it look good</summary>
  
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
</details>

<details>
  <summary>Main Class</summary>

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
</details>

## Who can enter?

## How to submit your entry?

## Timeline

## Prizes

## FAQ

- How to get support
