var eventHub = new Vue();

function cocoa_reset_finger() {
}

var _cocoa_get_finger_called = 0;

function cocoa_get_finger() {
  _cocoa_get_finger_called++;
  if (_cocoa_get_finger_called % 2 == 0) {
    return null;
  } else {
    return "FFFF";
  }
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

Vue.component('request-three-finger-view', {
  template: '<div>\
      <img class="spinner" src="spinner.png" srcset="spinner@2x.png 2x, spinner@3x.png 3x" width="127" height="127" />\
      <p><slot>PLACE FINGER 3 TIMES ON SCANNER TO FINISH</slot></p>\
      <div id="three_fingers_pane">\
        <span v-show="data_count > 0"><img class="finger_icon" src="fingerprintIcon@3x.png" width="74" height="74"></span>\
        <span v-show="data_count > 1"><img class="finger_icon" src="fingerprintIcon@3x.png" width="74" height="74"></span>\
        <span v-show="data_count > 2"><img class="finger_icon" src="fingerprintIcon@3x.png" width="74" height="74"></span>\
      <div>\
    </div>',
  data: function() {
    return {
      data_count: 0,
      d: [],
      no_finger: false,
      token: 0
    };
  },
  created: function() {
    eventHub.$on('start_request_three_fingers', this.begin_request);
  },
  methods: {
    begin_request: function() {
      this.data_count = 0;
      this.d = [];
      this.no_finger = false;
      this.token = Math.random();
      this.request_finger(this.token);
    },
    request_finger: function(token) {
      if (this.data_count >= 3) return;
      if (token != this.token) return;
      var ctx = this;
      var poll_finger = function() {
        if (token != ctx.token) return;
        var d = {};
        d = cocoa_get_finger();

        if (d && ctx.no_finger) {
          // New fingerpint
            ctx.d.push(d);
            ctx.data_count++;
            if (ctx.data_count < 3) {
              setTimeout(function(){ctx.request_finger(token)}, 800);
            } else {
              ctx.$emit("got_three_fingerprint", ctx.d);
            }
            ctx.no_finger = false;
        } else if (d && !ctx.no_finger) {
          // Finger continually pressed. Need to relase and press again.
          setTimeout(function(){ctx.request_finger(token)}, 800);
        } else { 
          // No finger found. Now we can get the next finger.
          ctx.no_finger = true;
          setTimeout(poll_finger, 500);
        }
      };
      setTimeout(poll_finger, 500);
    }
  }
})

Vue.component('add-finger-view', {
  template: '<div id="add-finger-view">\
    <h2>SELECT A FINGER</h2>\
    <select v-model="selected" @change="on_change">\
      <option v-for="f in fingers">{{f}}</option>\
    </select>\
    <request-three-finger-view  v-show="selected != null" \
                                v-on:got_three_fingerprint="fingerprint_collected">\
    </request-three-finger-view>\
  </div>',
  props: ["banned_fingers"],
  data: function() {
    var fingers = ["LEFT THUMB", "LEFT INDEX", "LEFT MIDDLE", "LEFT RING", "LEFT PINKY",
                "RIGHT THUMB", "RIGHT INDEX", "RIGHT MIDDLE", "RIGHT RING", "RIGHT PINKY"];
    var valid_fingers = [];
    for (var i = 0; i < fingers.length; i++) {
      var f = fingers[i];
      var banned = false;
      for (var j = 0; j < this.banned_fingers.length; j++) {
        if (this.banned_fingers[j].name === f) {
          banned = true;
          break;
        }
      }
      if (!banned) {
        valid_fingers.push(f);
      }
    }
    return {
      "fingers": valid_fingers,
      selected: null
    }; 
  },
  methods: {
    on_change: function(e) {
      eventHub.$emit('start_request_three_fingers');
    },
    fingerprint_collected: function(d) {
      if (this.selected) {
        var f = {"name":this.selected, "data":d[0]+d[1]+d[2]};
        this.$emit("finger_added", f);
      }
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
      <add-finger-view v-if="!selected_finger" v-on:finger_added="finger_added" :banned_fingers=user.fingers />\
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

Vue.component('wait_matching_view', {
  template: '<div>\
    <request-three-finger-view v-on:got_three_fingerprint="fingerprint_collected">\
    PLACE FINGER 3 TIMES ON SCANNER TO START\
    </request-three-finger-view>\
  </div>',
  data: function() {
    return {};
  },
  mounted: function() {
    console.log('mounted');
    eventHub.$emit('start_request_three_fingers');
  },
  methods: {
    fingerprint_collected: function(d) {
      // TODO: merge d[0], d[1] and d[2]
      var data = d[0]; 
      this.$emit('done', data);
    }
  }
})

Vue.component('matching_view', {
  template: '<div>Match</div>'
})

Vue.component('server', {
  template: '<div>\
    <wait_matching_view v-if="finger_to_search == null" v-on:done=finger_available >\
    </wait_matching_view>\
    <matching_view v-if="finger_to_search != null">\
    </matching_view>\
  </div>',
  created: function() {
    eventHub.$on('reset-server', this.reset);
  },
  data: function() {
    return {
      finger_to_search: null
    };
  },
  methods: {
    reset: function() {
      this.finger_to_search = null;
    },
    finger_available: function(f) {
      console.log('available!', f);
      this.finger_to_search = f;
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
      } else if (p === "SERVER") {
        eventHub.$emit('reset-server');
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