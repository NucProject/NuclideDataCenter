/**
 * Created by yuzhongmin on 14-6-5.
 */
$class("StationTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    _connList: null,

    _onlineStr: null,


    __constructor: function() {

    },

    onAttach: function(domNode) {

        var this_ = this;
        this._stationId = domNode.attr('station_id');
        console.log(this._stationId);

        var stationStatusNode = domNode.find('div.caption span.offline');
        setInterval(function(){
            stationStatusNode.text(this_.getOnlineString())
        }, 10000);
        stationStatusNode.text(this_.getOnlineString())

        this._connList = new ListView();
        var listDomNode = this._connList.create();
        listDomNode.appendTo(domNode.find("div.conn-alert-list"));

        this._connList.setHeaders([
            {'key':'begintime', 'name':'(断线)开始时间'},
            {'key':'endtime', 'name':'(断线)结束时间'}
        ]);

        var this_ = this;
        domNode.delegate('ul.nav-tabs a', 'click', function(){
            this_.onTabChanged();
        });

    },

    getOnlineString: function() {
        var this_ = this;

        this.ajax('command/online/' + this._stationId, null, function(data){
            // console.log(data);
            var d = eval('(' + data + ')');
            if (d['errorCode'] == 0)
            {
                var diff = d['results']['diff'];
                if (diff > 120)
                {
                    this_._onlineStr = "(在线测试...)";
                }
                else
                {
                    this_._onlineStr = "(在线)";
                }
            }

        });

        return this._onlineStr || "(在线测试...)";
    },

    onTabChanged: function() {
        this.refreshConnList(g.getCurrentStationId());
    },

    refreshConnList: function(stationId) {
        console.log(stationId)
        var this_ = this;
        this.ajax("command/alive/" + stationId, null, function(data)
        {
            //console.log(data);
            var d = eval('(' + data + ')');
            if (d['errorCode'] == 0)
            {
                this_.fillList(d['results']['items'])
            }
        });
    },

    fillList: function(items) {
        var params = this._connList.clearValues();
        console.log(items);
        for (var i in items) {
            var item = items[i];
              if (item['begintime'] != item['endtime'])
                  this._connList.addValue(item, params);
              else
              {
                  // 如果endtime - now < 120,不显示或者显示为正常
                  var endTime = +Date.parse(item['endtime']);
                  if ((endTime - Date.now()) / 1000 > 120) {
                      item['endtime'] = "断线中";
                      this._connList.addValue(item, params);
                  }
              }
        }
        return false;
    },

    f: function() {
        this._stationId = g.getCurrentStationId();
        var stationStatusNode = this._domNode.find('div.caption span.offline');
        this.ajax('command/online/' + this._stationId, null, function(data){
            console.log(data);
            var d = eval('(' + data + ')');
            if (d['errorCode'] == 0)
            {
                var diff = d['results']['diff'];
                if (diff > 120)
                {
                    stationStatusNode.text(" (离线)")
                }
                else
                {
                    stationStatusNode.text(" (在线)")
                }
            }

        });
    },

    onTabChanged: function() {
        this.refreshConnList(g.getCurrentStationId());
    },

    refreshConnList: function(stationId) {
        console.log(stationId)
        var this_ = this;
        this.ajax("command/alive/" + stationId, null, function(data)
        {
            console.log('2' +  data);
            var d = eval('(' + data + ')');
            if (d['errorCode'] == 0)
            {
                this_.fillList(d['results']['items'])
            }
        });
    },

    fillList: function(items) {
        var params = this._connList.clearValues();
        for (var i in items) {
            var item = items[i];
            if (item['begintime'] != item['endtime'])
            {
                this._connList.addValue(item, params);
            }

        }
        return;
    }
});