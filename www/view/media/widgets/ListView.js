/**
 * Created by Healer on 14-6-5.
 */

$class("ListView", [kx.Weblet, kx.ActionMixin, kx.EventMixin],
{
    _headers: null,

    _templateString: "<table class='table table-striped table-bordered table-hover table-full-width dataTable'><thead></thead><tbody></tbody></table>",

    _data: null,

    _currentPage: 1,

    __constructor: function() {

    },

    onCreated: function(domNode) {

    },

    setPageEvent: function(event) {
        var this_ = this;
        this._domNode.bind(event, function(e, sender, data){
            this_.onPageChanged(data);
        });
    },

    onPageChanged: function(data) {
        var page = data;
        this._currentPart = page - 1;

        this.fillItems(this._items);
    },

    refresh: function(api, payload) {
        this.ajax(api, payload, kx.bind(this, "dataReceived"));
    },

    setHeaders: function(headers) {

        this._headers = headers;
        var thead = this._domNode.find("thead");

        var cl = ["<tr>"];
        for (var i in headers)
        {
            // console.log(headers[i]);
            cl.push('<td>');
            cl.push(headers[i]['name']);
            cl.push('</td>');
        }
        var html = cl.join("");

        thead.append($(html));
    },

    getShownData: function() {
        return this._items;
    },

    dataReceived: function(data) {
        var results = eval("(" + data + ")")['results'];
        var items = results['items']
        this._items = items;

        this.fillItems(this._items);
    },

    fillItems: function(items) {

        var tbody = this._domNode.find("tbody");
        tbody.empty();

        var headers = [];
        for (var j in this._headers)
        {
            headers.push(this._headers[j]['key']);
        }


        for (var i in items)
        {
            if (i < this._currentPart * 120)
                continue;

            if (i > (this._currentPart + 1) * 120)
                break;

            var cl = ["<tr>"];
            var item = items[i];
            for (var j in headers)
            {
                var key = headers[j];
                cl.push('<td>');

                if (key == 'handle')
                {
                    cl.push("<a class='btn blue handle'>处理</a>&nbsp;<input class='comment' placeholder='处理意见'/>");
                }
                else if (this._headers[j]['type'] == 'url')
                {
                    cl.push("<a href=" + item[key] + ">链接</a>");
                }
                else
                {
                    cl.push(item[key]);
                }
                cl.push('</td>');

            }

            cl.push("</tr>");

            var html = cl.join("");

            tbody.append($(html));
        }
    }
});