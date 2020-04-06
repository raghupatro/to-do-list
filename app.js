const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-shashank:ovfN6LuubCs5WK8Q@cluster0-uzhcr.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = mongoose.Schema({ name: String });
const listSchema = mongoose.Schema({ name: String, items: [itemsSchema] });

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({ name: "Welcome to your To-Do List" });
const item2 = new Item({ name: "Click the + icon to add an item" });
const item3 = new Item({ name: "<-- Click here to delete an item" });

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (err) console.log(err);
    else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) { });
      }
      res.render("list", {
        listName: "Today",
        newListItems: foundItems,
      });
    }
  });
});

app.get("/about", function (req, res) { //if about is targeted this fn will take care of it
  res.render("about");
})

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  // console.log(customListName);
  if (customListName) {   //if home route is being targeted this won't be called again bcoz customListName will be undefined
    // console.log(customListName);
    List.findOne({ name: customListName }, function (error, foundList) {
      if (!error) {
        if (!foundList) {
          const list = new List({ name: customListName, items: defaultItems });
          list.save();
          // console.log("made a new list and now redirecting to /" + customListName);
          res.redirect("/" + customListName);
        }
        else {
          // console.log("had an existing list with name " + customListName + " ... rendering that one");
          res.render("list", { listName: foundList.name, newListItems: foundList.items });
        }
      }
    })
  }
});


app.post("/", function (req, res) {
  const newTask = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({ name: newTask });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (err) {
        console.log(err);
      }
      else {
        // console.log("found a list with the name " + listName + " --> " + foundList);
        foundList.items.push(newItem);
        foundList.save();
        // console.log("added the new item to the found list ... redirecting to /" + listName);
        res.redirect("/" + listName);

      }
    })
  }
});

app.post("/delete", function (req, res) {
  // console.log(req.body);
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (error) {
      if (error) console.log(error); else {
        // console.log("successfully removed item with id " + item_id);
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, { new: true }, function (err, foundList) {
      if (!err) {
        // console.log("successfully removed item with id " + checkedItemId);
        // console.log("the list after updation is --> " + foundList);
        res.redirect("/" + listName);
      }
    })
  }
})
let port = process.env.PORT;
if (port === null || port === "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started successfully");
});
