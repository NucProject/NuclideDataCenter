/**
* Created by Healer on 14-8-23.
*/

$class("HpgeDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "hpge";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'sid', 'name':'采样ID'},
            {'key':'starttime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'path', 'name':'下载', 'type': 'url'}]);

        this.createSummaryList(domNode);

    },

    // 特殊处理 Hpge的数据有文件时间一样的!
    makeDataDict: function(items) {
        var dict = [];
        for (var i in items) {
            var item = items[i];
            var t = item['time']; // 不能以time为key，并且排序了.
            t = t + i;
            dict[t] = item;
            console.log(item)
        }
        this._dict = dict;
        return this._dict;
    },

    createSummaryList: function(domNode) {
        var sumContainer = domNode.find('div.sum-container');
        this._sumListView = new ListView();
        var dataListViewDomNode = this._sumListView.create();
        dataListViewDomNode.appendTo(sumContainer);

        var this_ = this;

        // Summary
        this._sumListView.setHeaders([
            {'key':'id', 'type': 'id'},
            {'key':'sid', 'name': '采样ID', 'type': 'link'},
            {'key':'begintime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'barcode', 'name':'条码'},
            {'key':'count', 'name':'文件数量'},
            {'key':'handle', 'name':'补齐'}]);

        this_._sumListView._domNode.delegate('a[href]', 'click', function(){
            var sid = $(this).attr('href');
            window.open('/main/index/hpge/' + sid);
            return false;
        });

        this_._sumListView._domNode.delegate('td a.supp', 'click', function(){
            var sid = $(this).attr('data');
            this_.setCommandForHpgeFiles(sid);
        });

        this_._sumListView._domNode.delegate('td a.remove', 'click', function(){
            // var sid = $(this).attr('data')
            this_.removeRecord($(this));
        });

    },

    setCommandForHpgeFiles: function(sid) {
        var payload = {
            'type': 'history',
            'station': g.getCurrentStationId(),
            'device': 'hpge',
            'content': {
                'sid': sid
            }
        };
        this.ajax('command/post', payload, function(data){
            g.showTip('已发送成功获取历史数据的指令');
        });
    },

    removeRecord: function (sender) {
        var sid = sender.attr('data')
        this.ajax('data/delCinderellaSummary/' + g.getCurrentStationId() + '/' + sid, null, function(data){
            var r = eval("("+data+")");

            console.log(r);
            var tr = sender.parent().parent();
            if (r.errorCode == 0) {
                tr.slideUp();
            } else {
                alert('删除记录失败');
            }
        });
    },

    updateSummaryList: function(items) {
        this._sumDict = {};
        for (var i in items) {
            var item = items[i];
            if (item.count < 13)
            {
                item.handle = "<a class='btn blue mini supp' data=" + item.sid + ">补齐文件</a>";
            }
            var time = item.begintime;
            item.begintime = time.toString();
            this._sumDict[time] = item;
        }

        this.fillSummaryList(1, this._sumDict, this._sumListView);
    },


    onChangeSumPage: function (page) {
        // console.log(page);
        this.fillSummaryList(page, this._sumDict, this._sumListView);
    },

    onSummaryShow: function() {
        var this_ = this;

        this.ajax('data/cinderellaSummary2/' + g.getCurrentStationId(), null, function(data){
            var r = eval("("+data+")");
            var items = r['results']['items'];
            this_.updateSummaryList(items);
        });
    },

    fillListDefault: function(page) {
        this.fillList(page)
    },

    onShow: function(params) {
        //this.__super(DeviceBase.prototype.onShow, params);

        this._currentShownDevice = this._deviceType;
        console.log("On Show: " + this._currentShownDevice);

        if (!params) {
            var payload = {
                start: g.getBeginTime('yyyy-MM-dd'),
                end: g.getEndTime('yyyy-MM-dd'),
                sid: null
            };
        } else {
            var payload = {
                start: g.getBeginTime('yyyy-MM-dd'),
                end: g.getEndTime('yyyy-MM-dd'),
                sid: params
            };

            this._domNode.find('ul.nav_tabs')
        }
        console.log(payload);
        this.fetchDataBySid(payload);

        return false;
    },

    fetchDataBySid: function(payload) {
        var this_ = this;
        var currentStationId = g.getCurrentStationId();

        if (currentStationId)
        {
            var api = "data/fetchHpge/" + currentStationId;

            this.ajax(api, payload, function(data){
                var $r = eval("(" + data + ")");

                console.log($r);

                var items = $r.results.items;
                this_._items = items;
                this_.makeDataDict(items);

                this_.renderData();

            });
        }
    }
});
