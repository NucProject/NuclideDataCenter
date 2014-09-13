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
            {'key':'Pressure', 'name':'气压'}]);

        this.createSummaryList(domNode);
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

        sumContainer.delegate('a', 'click', function(){

            this_.onSidClicked($(this));
            return false;
        });

        // Summary
        this._sumListView.setHeaders([
            {'key':'id', 'type': 'id'},
            {'key':'sid', 'name': '采样ID', 'type': 'link'},
            {'key':'begintime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'barcode', 'name':'条码'},
            {'key':'flow', 'name':'累计流量'},
            {'key':'flowPerHour', 'name':'平均瞬时流量'},
            {'key':'pressure', 'name':'平均气压'}]);
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
        var params = this._sumListView.clearValues();
        for (var i in items) {
            var item = items[i];
            this._sumListView.addValue(item, params);
        }
    },

    onSidClicked: function(sender) {
        var sid = sender.text();
        DeviceSummaryBase.showDevice('hpge', sid);

    }
});
