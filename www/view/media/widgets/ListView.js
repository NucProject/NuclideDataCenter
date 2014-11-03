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
            if (headers[i]['type'] == 'id')
                continue;

            cl.push('<td>');
            cl.push(headers[i]['name']);
            cl.push('</td>');
        }
        var html = cl.join("");

        thead.append($(html));
    },

    dataReceived: function(data) {
        var results = eval("(" + data + ")")['results'];
        var items = results['items']
        this._items = items;

        this.fillItems(this._items);
    },

    clearValues: function() {
        var tbody = this._domNode.find("tbody");
        tbody.empty();


        var headers = [];
        for (var j in this._headers)
        {
            headers.push(this._headers[j]['key']);
        }

        return {
            tbody: tbody,
            headers: headers };
    },

    addValue: function(item, params) {
        var tbody = params.tbody;
        var headers = params.headers;

        var cl = ["<tr>"];

        var id = null;
        for (var j in headers)
        {
            var key = headers[j];

            if (this._headers[j]['type'] == 'id')
            {
                id = item[key];
                continue;
            }
            cl.push('<td>');

            var itemType = this._headers[j]['type'];

            if (key == 'handle')
            {
                cl.push(item['handle']);
            }
            else if (itemType == 'url')
            {
                var path = item[key];
                var fileName = path.substr(path.lastIndexOf('/') + 1);
                cl.push("<a href=" + item[key] + ">" + fileName + "</a>");
            }
            else if (itemType == 'link')
            {
                var v = item[key];
                cl.push("<a href=" + item[key] + ">" + v + "</a>");
            }
            else if (itemType == 'function')
            {
                var func = this._headers[j]['function'];
                cl.push(func.apply(null, item[key]));
            }
            else
            {
                if (itemType == 'num')
                {
                    var accuracy = this._headers[j]['accuracy'] || 2;
                    cl.push(parseFloat(item[key]).toFixed(accuracy));
                }
                else
                {
                    cl.push(item[key]);
                }
            }
            cl.push('</td>');

        }

        cl.push("</tr>");

        var html = cl.join("");

        var tr = $(html);
        if (id)
        {
            tr.attr('data-id', id);
        }
        tbody.append(tr);

    },

    addEntry: function(item) {
        var tbody = this._domNode.find("tbody");

        var headers = [];
        for (var j in this._headers)
        {
            headers.push(this._headers[j]['key']);
        }

        var cl = ["<tr>"];

        var id = null;
        for (var j in headers)
        {
            var key = headers[j];

            if (this._headers[j]['type'] == 'id')
            {
                id = item[key];
                continue;
            }
            cl.push('<td>');

            if (key == 'handle')
            {
                cl.push(item['handle']);
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

        var tr = $(html);
        if (id)
        {
            tr.attr('data-id', id);
        }
        tbody.append(tr);
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
            var id = null;
            for (var j in headers)
            {
                var key = headers[j];

                if (this._headers[j]['type'] == 'id')
                {
                    id = item[key];
                    continue;
                }
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
                    if (this._headers[j]['type'] == 'num')
                    {
                        cl.push(item[key].toFixed(1));
                    }
                    else if (this._headers[j]['type'] == 'str')
                    {
                        cl.push(item[key]);
                    }
                    else
                    {
                        cl.push(item[key]);
                    }
                }
                cl.push('</td>');

            }

            cl.push("</tr>");

            var html = cl.join("");

            var tr = $(html);
            if (id)
            {
                tr.attr('data-id', id);
            }
            tbody.append(tr);
        }
    }
});