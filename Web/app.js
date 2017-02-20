function cocoa_reset_finger() {
}

function cocoa_get_finger() {
  return "FFFF";
}

function cocoa_update_users(users) {
}

function cocoa_match_finger(f1, f2) {
  var score = 0;
  console.log(f1, f2);
  return Math.random();
}

Vue.component('fingerprint-list', {
  template: '<ul class="fingers">\
  <li class="finger" v-for="f in fingers" :class="{highlight:selected_finger&&f.name===selected_finger.name, matching:is_matching(f)}"\
      @click="click_finger(f)">\
  {{f.name}}\
  </li>\
  </ul>',
  props: ['user', 'fingers', 'selected_finger', 'matching'],
  methods: {
    click_finger: function(f) {
      this.$emit('finger_clicked', f, this.user);
    },
    is_matching: function(f) {
      if (!f || !this.matching) return false;
      return cocoa_match_finger(f.data, this.matching) > 0.92;
    }
  }
})

Vue.component('user-list', {
  template: '<div>\
  <ol>\
  <li class="user" v-for="u in users">\
    {{u.name}}\
    <div>\
    <fingerprint-list :user="u" :fingers="u.fingers" :matching="matching" v-on:finger_clicked="finger_clicked" />\
    <button @click="select_user(u)">▶︎</button>\
    </div>\
  </li>\
  </ol>\
  </div>',
  props: ['users', 'matching'],
  methods: {
    select_user: function(u) {
      this.$emit('view_user', u)
    },
    finger_clicked: function(f, u) {
      this.$emit('finger_clicked', f, u)
    }
  }
})


Vue.component('finger-data-view', {
  template: '<div class="finger_data_view">\
    <span>{{number}}</span>\
    <div class="hex_view">\
      {{data.substring(0, 1024)}}\
    </div>\
    <hr />\
    <img src="fingerprint.png" width="100" height="100" />\
  </div>',
  props: ["data", "number"]
})

Vue.component('finger-view', {
  template: '<div>\
  <h1>{{finger.name}}</h1>\
  <finger-data-view :data=finger.data />\
  <button @click="delete_finger">DELETE FINGER</button>\
  </div>',
  props: ["finger"],
  methods: {
    delete_finger: function() {
      this.$emit('delete_finger', this.finger);
    }
  }
})

Vue.component('add-finger-view', {
  template: '<div id="add-finger-view">\
    <h2>SELECT A FINGER</h2>\
    <select v-model="selected" @change="on_change">\
      <option v-for="f in fingers">{{f}}</option>\
    </select>\
    <p>PLACE FINGER 3 TIMES ON SCANNER TO FINISH</p>\
    <span v-show="data_count > 0">☝🏻</span>\
    <span v-show="data_count > 1">☝🏻</span>\
    <span v-show="data_count > 2">☝🏻</span>\
  </div>',
  data: function() {
    return {
      fingers: ["LEFT THUMB", "LEFT INDEX", "LEFT MIDDLE", "LEFT RING", "LEFT PINKY",
                "RIGHT THUMB", "RIGHT INDEX", "RIGHT MIDDLE", "RIGHT RING", "RIGHT PINKY"],
      selected: null,
      data_count: 0,
      d: [],
      token: 0
    };
  },
  methods: {
    on_change: function(e) {
      this.data_count = 0;
      this.d = [];
      this.token = Math.random();
      this.request_finger(this.token);
    },
    request_finger: function(token) {
      if (this.data_count >= 3) return;
      if (token != this.token) return;
      var ctx = this;
      cocoa_reset_finger();
      var poll_finger = function() {
        if (token != ctx.token) return;
        var d = {};
        d = cocoa_get_finger();
        if (d) {
          ctx.d.push(d);
          ctx.data_count++;
          if (ctx.data_count < 3) {
            setTimeout(function(){ctx.request_finger(token)}, 2200);
          } else {
            // finish!
            var f = {"name":ctx.selected, "data":ctx.d[0]+ctx.d[1]+ctx.d[2]};
            ctx.$emit("finger_added", f);
          }
        } else {
          setTimeout(poll_finger, 500);
        }
      };
      setTimeout(poll_finger, 500);
    }
  }
})

Vue.component('user-view', {
  template: '<div id="user_view" class="second_pane">\
  <h2>{{user.name}}</h2>\
  <fingerprint-list :fingers="user.fingers" :selected_finger="selected_finger" v-on:finger_clicked=finger_clicked />\
  <button @click="delete_user">DELETE USER</button>\
  <button @click="add_finger">ADD FINGER</button>\
    <div class="third_pane">\
      <finger-view v-if="selected_finger" :finger=selected_finger v-on:delete_finger="delete_finger" />\
      <add-finger-view v-if="!selected_finger" v-on:finger_added="finger_added" />\
    </div>\
  </div>',
  props: ["user"],
  data: function() {
    return {
      selected_finger: (this.user.fingers.length > 0 ? this.user.fingers[0] : null)
    };
  },
  methods: {
    delete_user: function() {
      this.$emit('delete_user', this.user)
    },
    add_finger: function() {
      this.selected_finger = null;

    },
    finger_clicked: function(f) {
      this.selected_finger = f
    },
    delete_finger: function(f) {
      this.$emit('delete_finger', this.user, f)
      this.selected_finger = (this.user.fingers.length > 0 ? this.user.fingers[0] : null)
    },
    finger_added: function(f) {
      this.$emit('finger_added', this.user, f)
      this.selected_finger = f;
    }
  }
})

Vue.component('new_user', {
  template: '<div>\
    <p>ENTER USER ID</p>\
    <input type="text" v-bind:value="value" v-on:input="updateValue($event.target.value)" />\
    <button @click="next(value)" class="bottom_right_button">NEXT</button>\
  </div>',
  props: ['value'],
  methods: {
    updateValue: function(value) {
      this.$emit('input', value)
    },
    next: function(name) {
      this.$emit('new_user_done', {'name': name, 'fingers':[]});
    }
  }
})

Vue.component('match-view', {
  template: '<div id="match_view">\
  <div id="match_view_info">\
    <p>{{user.name}}</p>\
    <p>{{saved.name}}</p>\
  </div>\
  <div id="match_view_overview">\
    <h2>MATCHING</h2>\
    <h1>{{score}}%</h1>\
    <p>{{duration}} SECONDS</p>\
  </div>\
  <div id="match_view_detail">\
    <div class="finger">\
      <h3>SAVED</h3>\
      <finger-data-view :data="saved.data" />\
    </div>\
    <div class="finger">\
      <h3>CURRENT</h3>\
      <finger-data-view :data="current" />\
    </div>\
  </div>\
  </div>',
  props: ['user', 'saved', 'current', 'duration'],
  computed: {
    score: function() {
      if (!this.saved || !this.current) {
        this.duration = 0;
        return 0;
      }
      var beginDate = new Date();
      var s = Math.floor(cocoa_match_finger(this.saved.data, this.current) * 10000) / 100;
      var endDate = new Date();
      this.duration = Math.floor((endDate - beginDate)) / 1000;
      return s;
    }
  }
})

Vue.component('local', {
  template: '<div>\
    <new_user v-if="mode===\'new\'" v-model="new_user_name" v-on:new_user_done="user_added"></new_user>\
    <div v-if="mode===\'list\'">\
      <user-list :users="users" :matching="matching" v-on:view_user="display_user" v-on:finger_clicked="finger_clicked"/>\
      <button @click="add_user" class="bottom_right_button">ADD USER +</button>\
    </div>\
    <user-view v-if="mode===\'view\'" :user="selected_user" \
               v-on:delete_user="delete_user" \
               v-on:delete_finger="delete_finger" \
               v-on:finger_added="finger_added" />\
    <match-view v-if="mode===\'match\'" :user="current_user" :saved="finger" :current="matching" :duration="0.3" :score="96" />\
  </div>',
  props: ['users', 'mode', 'selected_user', 'matching'],
  data: function() {
    return {
      'new_user_name':'',
      'finger': null,
      'current_user': null
    }
  },
  methods: {
    add_user: function() {
      this.new_user_name = "";
      this.$emit('show_new_user');
    },
    user_added: function(user) {
      this.$emit('add_user', user);
      this.$emit('show_user', user);
    },
    display_user: function(user) {
      this.$emit('show_user', user);
    },
    delete_user: function(user) {
      this.$emit('delete_user', user);
    },
    delete_finger: function(u, f) {
      this.$emit('delete_finger', u, f);
    },
    finger_added: function(u, f) {
      this.$emit('finger_added', u, f);
    },
    finger_clicked: function(f, u) {
      this.current_user = u;
      this.finger = f;
      this.$emit('show_match');
    }
  }
})

var app = new Vue({
  el: '#app',
  data: {
    connected: true,
    pages: ["LOCAL", "SERVER", "GITHUB"],
    current_page: "LOCAL",
    users: [{"name":"yllan", "fingers":[{"name":"LEFT MIDDLE", "data":"CAFEBABE"}]}],
    local_mode: "list",
    selected_user: null,
    backend: null,
    matching: null
  },
  methods: {
    click_nav: function(p) {
      this.current_page = p;
      if (p === "LOCAL") {
        this.local_mode = "list";
      }
    },
    show_new_user: function() {
      this.local_mode = "new";
    },
    show_user_list: function() {
      this.local_mode = "list";
    },
    add_user: function(u) {
      this.users.push(u);
      cocoa_update_users(this.users);
    },
    show_user: function(u) {
      this.selected_user = u;
      this.local_mode = "view";
    },
    show_match: function() {
      this.local_mode = "match";
    },
    delete_user: function(user) {
      var result = [];
      for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].name != user.name)
          result.push(this.users[i]);
      }
      this.users = result;
      this.local_mode = "list";
      cocoa_update_users(this.users);
    },
    delete_finger: function(u, f) {
      var result = [];
      for (var i = 0; i < u.fingers.length; i++) {
        if (u.fingers[i].name != f.name)
          result.push(u.fingers[i]);
      }
      u.fingers = result;
      cocoa_update_users(this.users);
    },
    finger_added: function(u, f) {
      u.fingers.push(f);
      this.users = this.users;
      cocoa_update_users(this.users);
    }
  }
});