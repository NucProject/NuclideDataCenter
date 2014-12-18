/**
 * Created by Healer on 14-8-23.
 */


$class("CinderellaDevice", DeviceBase,
{
    _sumListView: null,

    __constructor: function() {
        this._deviceType = "cinderelladata";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Sid', 'name':'采样ID'},
            {'key':'barcode', 'name':'条 码'},
            {'key':'BeginTime', 'name':'开始时间'},
            {'key':'Flow', 'name':"流量"},
            {'key':'FlowPerHour', 'name':'瞬时流量'},
            {'key':'Pressure', 'name':'气压'},
            {'key':'PressureDiff', 'name':'气流压差'},
            {'key':'Temperature', 'name':'温度'}]);

        this.createSummaryList(domNode);
    },

    showChartsTab: function() {
        this.updateCharts();
    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var interval =  this._chartInterval || 30 * 1000;
        this.showCharts(this._domNode,
            {
                selector: "div.charts",
                title: "瞬时流量",
                ytitle: "nGy/h",
                start: start,
                end: end,
                max:150, min:40,
                interval: interval,
                filter: kx.bind(this, 'filter')
            }
        );
    },

    filter: function(data) {
        var currentField = 'FlowPerHour';

        if (data.length <= 2880) {
            this._chartInterval = 30 * 1000;
            this._step = 30 * 1000;
        } else {

        }
        var d =  this.chartFilterData(data, currentField, this._chartInterval, this._step);
        return d;

    },

    fillListDefault: function(page) {

        this.fillList(page)

    },

    createSummaryList: function(domNode) {
        var sumContainer = domNode.find('div.sum-container');
        this._sumListView = new ListView();
        var dataListViewDomNode = this._sumListView.create();
        dataListViewDomNode.appendTo(sumContainer);

        var this_ = this;

        sumContainer.delegate('a[href]', 'click', function(){

            this_.onSidClicked($(this));
            return false;
        });

        sumContainer.delegate('a.remove', 'click', function(){

            this_.onRemoveClicked($(this));
            return false;
        });

        // Summary
        this._sumListView.setHeaders([
            {'key':'id', 'type': 'id'},
            {'key':'sid', 'name': '采样ID', 'type': 'link'},
            {'key':'begintime', 'name':'开始时间', 'type': 'string'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'barcode', 'name':'条码'},
            {'key':'flow', 'name':'累计流量'},
            {'key':'flowPerHour', 'name':'平均瞬时流量'},
            {'key':'worktime', 'name':'工作时间'},
            {'key':'handle', 'name':'处理'}]);
    },

    onSummaryShow: function() {
        var this_ = this;

        this.ajax('data/cinderellaSummary/' + g.getCurrentStationId(), null, function(data){
            var r = eval("("+data+")");
            var items = r['results']['items'];


            this_.updateSummaryList(items);
        });
    },

    updateSummaryList: function(items) {

        this._sumDict = {};
        for (var i in items)
        {
            var item = items[i];
            var sid = item.sid;
            if (!isNaN(item.flowPerHour))
            {
                item.flowPerHour = parseFloat(item.flowPerHour).toFixed(1);
            }
            item.handle = "<a class='btn red remove' sid='" + sid + "'>删除</a>";

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

    onSidClicked: function(sender) {
        var sid = sender.text();
        // DeviceSummaryBase.showDevice('hpge', sid);
        window.open('/main/index/hpge/' + sid)
    },

    onRemoveClicked: function(sender)
    {
        var sid = sender.attr('sid');

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
    }
});
