$.cookie.json = true;

new Vue({
  el: '#mj',
  data: {
    users: [
        {name:'玩家1', wind:0, money:0, no:0},
        {name:'玩家2', wind:1, money:0, no:1},
        {name:'玩家3', wind:2, money:0, no:2},
        {name:'玩家4', wind:3, money:0, no:3}

    ],

    logs:[],

    s: {
        basic : 2, // 底幾台
        point : 10, // 一台多少錢
        wind_no : 0, // 在哪個風 東風東=0 東風南=1 北風北=15
        banker_count : 0, // 連莊數
        next_banker_count : 0 // 下一輪 莊連
    },    
    winType:['胡', '自摸', '流局', '自行輸入log'],
    winds: ['東' , '南' , '西' , '北'],
    kinds:[
        {name:'門清', point:1},
        {name:'門清(自摸)', point:2},
        {name:'風台', point:1},
        {name:'雙風台', point:2},
        {name:'三元台', point:1},
        {name:'雙三元台', point:2},
        {name:'花牌', point:1},
        {name:'雙花牌', point:2},
        {name:'八仙過海,七搶一', point:8},
        {name:'清一色', point:8},
        {name:'湊一色', point:4},
        {name:'五暗坎', point:8},
        {name:'四暗坎', point:5},
        {name:'三暗坎', point:2},
        {name:'碰碰胡', point:4},
        {name:'平胡', point:2},
        {name:'全求', point:2},
        {name:'獨聽', point:1},
        {name:'搶槓', point:1},
        {name:'槓上開花', point:1},
        {name:'海底撈月', point:1},
        {name:'天胡', point:24},
        {name:'地胡', point:16},
        {name:'人胡', point:8},
        {name:'大四喜', point:16},
        {name:'小四喜', point:8},
        {name:'大三元', point:8},
        {name:'小三元', point:4},
        {name:'字一色', point:8},
    ]    
  },

  watch: {
    // timeago
    'logs': function (val, oldVal) {
      jQuery("abbr.timeago").timeago();
    }
  },

  computed: {
    wind_count:function(){
        return Math.floor(this.s.wind_no/4);
    },

    wind_count2:function(){
        return this.s.wind_no%4;
    }

  },

  ready: function(){
    this.init('first');    
  },

  methods:{
    init: function(type){
        var that = this;
        if(type == 'first'){
            this.logs = (data('mjLogs')) ? data('mjLogs') : [];
            this.s = (data('s')) ? data('s') : this.s;
        }
        
        var banker = $.grep(this.users, function(e){ return e.wind == (that.s.wind_no)%4; } )[0]['no'];

        this.$set('log', []);
        this.$set('winNo', 999);
        this.$set('userWin', -1);
        this.$set('userLose', -1);
        this.$set('set', 0);
        this.$set('kindArray', []);
        this.$set('note', '');
        this.$set('banker', banker);

        for (var i = this.users.length - 1; i >= 0; i--) {
            this.users[i]['money'] = 0;
        };

        this.kinds.sort(function(a, b) {
            return parseFloat(a.point) - parseFloat(b.point);
        });

        this.logs.map(function(log){
            log.log.map(function(count,index){
                count = parseInt(count, 10);
                if(count) that.users[index].money += count;
            });
        });

        data('s', this.s);
        data('mjLogs', this.logs);
    },

    changeDetail: function(){
        var s = this.s;
        var sumPoint = this.s.basic;
        var kinds = this.kinds;
        var nextWind = (this.s.wind_no+1)%4;
        var log = [0,0,0,0];
        var banker_point = (this.s.banker_count * 2) + 1; // 連莊台數
        var note = (this.s.banker_count > 0) ? '莊連' + this.s.banker_count : '';

        this.kindArray.forEach(function(b, index){
            if(b == true && kinds[index]) {
                sumPoint+= kinds[index]['point'];
                note = note + ' ' + kinds[index]['name'];
            }
            //console.log(kinds[index]['name']);
        });
        //console.log(sumPoint);

        s.next_banker_count = 0;

        // 莊家胡了 or 流局
        if(this.userWin == this.banker || this.winNo == '2'){
            s.next_banker_count = s.banker_count + 1;
        }
        // 莊家被胡
        else if(this.userLose == this.banker){
            sumPoint += banker_point;
        }

        // 自摸
        if(this.winNo == '1'){
            sumPoint++;
            sumPoint *= -1;
            var banker = sumPoint - banker_point;
            // 莊家自摸
            if(this.userWin == this.banker){
                s.next_banker_count = s.banker_count + 1;
                sumPoint = banker;
                log = [sumPoint , sumPoint , sumPoint , sumPoint];
                log[this.userWin] = sumPoint * -3;
            }
            else {                
                log = [sumPoint , sumPoint , sumPoint , sumPoint];
                log[this.banker] = banker;
                log[this.userWin] = (banker + sumPoint*2) * -1;
            }
        }
        // 胡了
        else if(this.winNo == '0'){
            log[this.userWin] = sumPoint;
            log[this.userLose] = -1 * sumPoint;
        }
        // 自行設定
        else if(this.winNo == '3'){
            this.set = 2;
        }

        for (var i = log.length - 1; i >= 0; i--) {
            log[i] = (log[i]) ? log[i] : '';
        };

        this.log = log;
        this.note = note;

        console.log(log);
    },

    insertLog: function(){
        var tmp = {};
        tmp.ts = new Date().toISOString();
        tmp.wind_count = this.wind_count;
        tmp.wind_count2 = this.wind_count2;
        tmp.log = this.log;
        tmp.note = this.note;
        
        this.logs.unshift(tmp);
        if(this.s.next_banker_count == 0){
            this.s.wind_no++;
            this.s.wind_no = (this.s.wind_no > 15) ? 0 : this.s.wind_no;
        }
        this.s.banker_count = this.s.next_banker_count;

        this.set = true;

        this.init();
    },

    showLog: function(log){
        log.$set('show',!log.show);
        data('mjLogs', this.logs);
    },

    deleteLog: function(){
        var tmp = this.logs.shift();

        // 有連莊
        if(this.s.banker_count > 0){
            this.s.banker_count--;
        }
        else {
            this.s.wind_no = tmp.wind_count*4 + tmp.wind_count2;
        }
        
        this.init();
    }
  }

});

function data(key, value){
    var type = (localStorage) ? 's' : 'cookie' ;
    var re;

    // 寫
    if(value !== undefined){
        if(type == 's'){
            re = localStorage.setItem(key, JSON.stringify(value));
        }
        else{
            re = $.cookie(key, value, { path: '/' , expires: 365});
        }

    }
    else{
        if(type == 's'){
            re = JSON.parse(localStorage.getItem(key));
        }
        else{
            re = $.cookie(key);
        }
    }

    return re;
}