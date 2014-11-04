/**
* Created by Healer on 14-8-23.
*/

$class("HpgeDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "hpge";
        this._noAlertData = true;
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

        this_._sumListView._domNode.delegate('td a.supp', 'click', function(){
            var sid = $(this).attr('data')
            this_.setCommandForHpgeFiles(sid);
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

    updateSummaryList: function(items) {
        var params = this._sumListView.clearValues();
        for (var i in items) {
            var item = items[i];
            if (item.count < 16)
            {
                item.handle = "<a class='btn blue supp' data=" + item.sid + ">补齐文件</a>";
            }
            this._sumListView.addValue(item, params);
        }
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
        }
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
