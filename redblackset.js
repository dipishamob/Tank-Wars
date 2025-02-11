"use strict";
{
  const js_cols = {};
  const RED = true;
  const BLACK = false;
  js_cols.RBnode = function (tree) {
    this.tree = tree;
    this.right = this.tree.sentinel;
    this.left = this.tree.sentinel;
    this.parent = null;
    this.color = false;
    this.key = null;
  };
  js_cols.RedBlackSet = function (compare_func) {
    this.size = 0;
    this.sentinel = new js_cols.RBnode(this);
    this.sentinel.color = BLACK;
    this.root = this.sentinel;
    this.root.parent = this.sentinel;
    this.compare = compare_func || this.default_compare;
  };
  js_cols.RedBlackSet.prototype.default_compare = function (a, b) {
    if (a < b) return -1;
    else if (b < a) return 1;
    else return 0;
  };
  js_cols.RedBlackSet.prototype.clone = function () {
    var rv = new js_cols.RedBlackSet(this.compare);
    rv.insertAll(this);
    return rv;
  };
  js_cols.RedBlackSet.prototype.clear = function () {
    this.size = 0;
    this.sentinel = new js_cols.RBnode(this);
    this.sentinel.color = BLACK;
    this.root = this.sentinel;
    this.root.parent = this.sentinel;
  };
  js_cols.RedBlackSet.prototype.leftRotate = function (x) {
    var y = x.right;
    x.right = y.left;
    if (y.left != this.sentinel) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent == this.sentinel) this.root = y;
    else if (x == x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  };
  js_cols.RedBlackSet.prototype.rightRotate = function (x) {
    var y = x.left;
    x.left = y.right;
    if (y.right != this.sentinel) y.right.parent = x;
    y.parent = x.parent;
    if (x.parent == this.sentinel) this.root = y;
    else if (x == x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  };
  js_cols.RedBlackSet.prototype.insert = function (key) {
    if (!this.contains(key)) {
      var z = new js_cols.RBnode(this);
      z.key = key;
      var y = this.sentinel;
      var x = this.root;
      while (x != this.sentinel) {
        y = x;
        if (this.compare(z.key, x.key) < 0) x = x.left;
        else x = x.right;
      }
      z.parent = y;
      if (y == this.sentinel) this.root = z;
      else if (this.compare(z.key, y.key) < 0) y.left = z;
      else y.right = z;
      z.left = this.sentinel;
      z.right = this.sentinel;
      z.color = RED;
      this.insertFixup(z);
      this.size++;
    } else {
      var node = this.get_(key);
      node.key = key;
    }
  };
  js_cols.RedBlackSet.prototype.insertFixup = function (z) {
    while (z != this.sentinel && z != this.root && z.parent.color == RED)
      if (z.parent == z.parent.parent.left) {
        var y = z.parent.parent.right;
        if (y.color == RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z == z.parent.right) {
            z = z.parent;
            this.leftRotate(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          if (z.parent.parent != this.sentinel)
            this.rightRotate(z.parent.parent);
        }
      } else {
        var y = z.parent.parent.left;
        if (y.color == RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z == z.parent.left) {
            z = z.parent;
            this.rightRotate(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          if (z.parent.parent != this.sentinel)
            this.leftRotate(z.parent.parent);
        }
      }
    this.root.color = BLACK;
  };
  js_cols.RedBlackSet.prototype.delete_ = function (z) {
    var y;
    var x;
    if (z.left == this.sentinel || z.right == this.sentinel) y = z;
    else y = this.successor_(z);
    if (y.left != this.sentinel) x = y.left;
    else x = y.right;
    x.parent = y.parent;
    if (y.parent == this.sentinel) this.root = x;
    else if (y == y.parent.left) y.parent.left = x;
    else y.parent.right = x;
    if (y != z) z.key = y.key;
    if (y.color == BLACK) this.deleteFixup(x);
    this.size--;
  };
  js_cols.RedBlackSet.prototype.deleteFixup = function (x) {
    while (x != this.root && x.color == BLACK)
      if (x == x.parent.left) {
        var w = x.parent.right;
        if (w.color == RED) {
          w.color = BLACK;
          x.parent.color = RED;
          this.leftRotate(x.parent);
          w = x.parent.right;
        }
        if (w.left.color == BLACK && w.right.color == BLACK) {
          w.color = RED;
          x = x.parent;
        } else {
          if (w.right.color == BLACK) {
            w.left.color = BLACK;
            w.color = RED;
            this.rightRotate(w);
            w = x.parent.right;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK;
          w.right.color = BLACK;
          this.leftRotate(x.parent);
          x = this.root;
        }
      } else {
        var w = x.parent.left;
        if (w.color == RED) {
          w.color = BLACK;
          x.parent.color = RED;
          this.rightRotate(x.parent);
          w = x.parent.left;
        }
        if (w.right.color == BLACK && w.left.color == BLACK) {
          w.color = RED;
          x = x.parent;
        } else {
          if (w.left.color == BLACK) {
            w.right.color = BLACK;
            w.color = RED;
            this.leftRotate(w);
            w = x.parent.left;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK;
          w.left.color = BLACK;
          this.rightRotate(x.parent);
          x = this.root;
        }
      }
    x.color = BLACK;
  };
  js_cols.RedBlackSet.prototype.remove = function (key) {
    var x = this.get_(key);
    if (x != this.sentinel) {
      var retval = x.key;
      this.delete_(x);
      return retval;
    } else return null;
  };
  js_cols.RedBlackSet.prototype.removeSwapped = function (value, key) {
    this.remove(key);
  };
  js_cols.RedBlackSet.prototype.min = function (x) {
    while (x.left != this.sentinel) x = x.left;
    return x;
  };
  js_cols.RedBlackSet.prototype.max = function (x) {
    while (x.right != this.sentinel) x = x.right;
    return x;
  };
  js_cols.RedBlackSet.prototype.successor_ = function (x) {
    if (x.right != this.sentinel) return this.min(x.right);
    var y = x.parent;
    while (y != this.sentinel && x == y.right) {
      x = y;
      y = y.parent;
    }
    return y;
  };
  js_cols.RedBlackSet.prototype.predeccessor_ = function (x) {
    if (x.left != this.sentinel) return this.max(x.left);
    var y = x.parent;
    while (y != this.sentinel && x == y.left) {
      x = y;
      y = y.parent;
    }
    return y;
  };
  js_cols.RedBlackSet.prototype.successor = function (key) {
    if (this.size > 0) {
      var x = this.get_(key);
      if (x == this.sentinel) return null;
      if (x.right != this.sentinel) return this.min(x.right).key;
      var y = x.parent;
      while (y != this.sentinel && x == y.right) {
        x = y;
        y = y.parent;
      }
      if (y != this.sentinel) return y.key;
      else return null;
    } else return null;
  };
  js_cols.RedBlackSet.prototype.predecessor = function (key) {
    if (this.size > 0) {
      var x = this.get_(key);
      if (x == this.sentinel) return null;
      if (x.left != this.sentinel) return this.max(x.left).key;
      var y = x.parent;
      while (y != this.sentinel && x == y.left) {
        x = y;
        y = y.parent;
      }
      if (y != this.sentinel) return y.key;
      else return null;
    } else return null;
  };
  js_cols.RedBlackSet.prototype.getMin = function () {
    return this.min(this.root).key;
  };
  js_cols.RedBlackSet.prototype.getMax = function () {
    return this.max(this.root).key;
  };
  js_cols.RedBlackSet.prototype.get_ = function (key) {
    var x = this.root;
    while (x != this.sentinel && this.compare(x.key, key) != 0)
      if (this.compare(key, x.key) < 0) x = x.left;
      else x = x.right;
    return x;
  };
  js_cols.RedBlackSet.prototype.contains = function (key) {
    return this.get_(key).key != null;
  };
  js_cols.RedBlackSet.prototype.getValues = function () {
    var ret = [];
    this.forEach(function (x) {
      ret.push(x);
    });
    return ret;
  };
  js_cols.RedBlackSet.prototype.insertAll = function (col) {
    if (js_cols.typeOf(col) == "array")
      for (var i = 0; i < col.length; i++) this.insert(col[i]);
    else if (js_cols.typeOf(col.forEach) == "function")
      col.forEach(this.insert, this);
    else if (js_cols.typeOf(col.getValues) == "function") {
      var arr = col.getValues();
      for (var i = 0; i < arr.length; i++) this.insert(arr[i]);
    } else if (js_cols.typeOf(col) == "object")
      for (var key in col) this.insert(col[key]);
  };
  js_cols.RedBlackSet.prototype.removeAll = function (col) {
    if (js_cols.typeOf(col) == "array")
      for (var i = 0; i < col.length; i++) this.remove(col[i]);
    else if (js_cols.typeOf(col.forEach) == "function")
      col.forEach(this.removeSwapped, this);
    else if (js_cols.typeOf(col.getValues) == "function") {
      var arr = col.getValues();
      for (var i = 0; i < arr.length; i++) this.remove(arr[i]);
    } else if (js_cols.typeOf(col) == "object")
      for (var key in col) this.remove(col[key]);
  };
  js_cols.RedBlackSet.prototype.containsAll = function (col) {
    if (js_cols.typeOf(col) == "array") {
      for (var i = 0; i < col.length; i++)
        if (!this.contains(col[i])) return false;
      return true;
    } else if (js_cols.typeOf(col.forEach) == "function")
      return col.every(this.contains, this);
    else if (js_cols.typeOf(col.getValues) == "function") {
      var arr = col.getValues();
      for (var i = 0; i < arr.length; i++)
        if (!this.contains(arr[i])) return false;
      return true;
    } else if (js_cols.typeOf(col) == "object") {
      for (var key in col) if (!this.contains(col[key])) return false;
      return true;
    }
  };
  js_cols.RedBlackSet.prototype.range = function (from, to) {
    var retArray = [];
    this.traverseFromTo(
      function (x) {
        retArray.push(x);
      },
      from,
      to
    );
    return retArray;
  };
  js_cols.RedBlackSet.prototype.traverse = function (f, opt_obj) {
    if (this.isEmpty()) return;
    var node = this.min(this.root);
    while (node != this.sentinel) {
      if (f.call(opt_obj, node.key, this)) return;
      node = this.successor_(node);
    }
  };
  js_cols.RedBlackSet.prototype.traverseFrom = function (f, fromKey, opt_obj) {
    if (this.isEmpty()) return;
    var node = this.get_(fromKey);
    while (node != this.sentinel) {
      if (f.call(opt_obj, node.key, this)) return;
      node = this.successor_(node);
    }
  };
  js_cols.RedBlackSet.prototype.traverseTo = function (f, toKey, opt_obj) {
    if (this.isEmpty()) return;
    var node = this.min(this.root);
    var toNode = this.get_(toKey);
    while (node != toNode) {
      if (f.call(opt_obj, node.key, this)) return;
      node = this.successor_(node);
    }
  };
  js_cols.RedBlackSet.prototype.traverseFromTo = function (
    f,
    fromKey,
    toKey,
    opt_obj
  ) {
    if (this.isEmpty()) return;
    var node = this.get_(fromKey);
    var toNode = this.get_(toKey);
    while (node != toNode) {
      if (f.call(opt_obj, node.key, this)) return;
      node = this.successor_(node);
    }
  };
  js_cols.RedBlackSet.prototype.traverseBackwards = function (f, opt_obj) {
    if (this.isEmpty()) return;
    var node = this.max(this.root);
    while (node != this.sentinel) {
      if (f.call(opt_obj, node.key, this)) return;
      node = this.predeccessor_(node);
    }
  };
  js_cols.RedBlackSet.prototype.forEach = function (f, opt_obj) {
    if (this.isEmpty()) return;
    for (
      var n = this.min(this.root);
      n != this.sentinel;
      n = this.successor_(n)
    )
      f.call(opt_obj, n.key, n.key, this);
  };
  js_cols.RedBlackSet.prototype.some = function (f, opt_obj) {
    if (this.isEmpty()) return false;
    for (
      var n = this.min(this.root);
      n != this.sentinel;
      n = this.successor_(n)
    )
      if (f.call(opt_obj, n.key, n.key, this)) return true;
    return false;
  };
  js_cols.RedBlackSet.prototype.every = function (f, opt_obj) {
    if (this.isEmpty()) return false;
    for (
      var n = this.min(this.root);
      n != this.sentinel;
      n = this.successor_(n)
    )
      if (!f.call(opt_obj, n.key, n.key, this)) return false;
    return true;
  };
  js_cols.RedBlackSet.prototype.map = function (f, opt_obj) {
    var rv = [];
    if (this.isEmpty()) return rv;
    for (
      var n = this.min(this.root);
      n != this.sentinel;
      n = this.successor_(n)
    )
      rv.push(f.call(opt_obj, n.key, n.key, this));
    return rv;
  };
  js_cols.RedBlackSet.prototype.filter = function (f, opt_obj) {
    var rv = [];
    if (this.isEmpty()) return rv;
    for (
      var n = this.min(this.root);
      n != this.sentinel;
      n = this.successor_(n)
    )
      if (f.call(opt_obj, n.key, n.key, this)) rv.push(n.key);
    return rv;
  };
  js_cols.RedBlackSet.prototype.getCount = function () {
    return this.size;
  };
  js_cols.RedBlackSet.prototype.isEmpty = function () {
    return this.size == 0;
  };
  js_cols.RedBlackSet.prototype.isSubsetOf = function (col) {
    var colCount = js_cols.getCount(col);
    if (this.getCount() > colCount) return false;
    var i = 0;
    if (this.isEmpty()) return true;
    for (
      var n = this.min(this.root);
      n != this.sentinel;
      n = this.successor_(n)
    )
      if (js_cols.contains.call(col, col, n.key)) i++;
    return i == this.getCount();
  };
  js_cols.RedBlackSet.prototype.intersection = function (col) {
    var result = new js_cols.RedBlackSet(this.compare);
    if (this.isEmpty()) return result;
    for (
      var n = this.min(this.root);
      n != this.sentinel;
      n = this.successor_(n)
    )
      if (col.contains.call(col, n.key, n.key, this)) result.insert(n.key);
    return result;
  };
  self.RedBlackSet = class RedBlackSet {
    constructor(sortFunc) {
      this._rbSet = new js_cols.RedBlackSet(sortFunc);
    }
    Add(item) {
      this._rbSet.insert(item);
    }
    Remove(item) {
      this._rbSet.remove(item);
    }
    Has(item) {
      return this._rbSet.contains(item);
    }
    Clear() {
      this._rbSet.clear();
    }
    toArray() {
      return this._rbSet.getValues();
    }
    GetSize() {
      return this._rbSet.getCount();
    }
    IsEmpty() {
      return this._rbSet.isEmpty();
    }
    ForEach(func) {
      this._rbSet.forEach(func);
    }
    Front() {
      if (this.IsEmpty()) throw new Error("empty set");
      const rbSet = this._rbSet;
      const n = rbSet.min(rbSet.root);
      return n.key;
    }
    Shift() {
      if (this.IsEmpty()) throw new Error("empty set");
      const item = this.Front();
      this.Remove(item);
      return item;
    }
    *values() {
      if (this.IsEmpty()) return;
      const rbSet = this._rbSet;
      for (
        let n = rbSet.min(rbSet.root);
        n != rbSet.sentinel;
        n = rbSet.successor_(n)
      )
        yield n.key;
    }
    [Symbol.iterator]() {
      return this.values();
    }
  };
}
