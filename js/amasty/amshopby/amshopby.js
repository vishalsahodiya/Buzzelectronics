function amshopby_start(){
    $$('.block-layered-nav .form-button').each(function (e){
        e.observe('click', amshopby_price_click_callback);
    });

    $$('.block-layered-nav .input-text[name=amshopby-price]').each(function (e){
        e.observe('focus', amshopby_price_focus_callback);
        e.observe('keypress', amshopby_price_click_callback);
    });

    $$('.block-layered-nav .amshopby_attr_search').each(function (e) {
        e.observe('keypress', function() {
            amshopby_attr_search(e);
        });
    });

    $$('a.amshopby-less', 'a.amshopby-more').each(function (a){
        a.observe('click', amshopby_toggle);
    });

    $$('span.amshopby-plusminus').each(function (span){
        span.observe('click', amshopby_category_show);
    });

    $$('.block-layered-nav.amshopby-collapse-enabled dt').each(function (dt){
        dt.observe('click', amshopby_filter_show);
    });

    $$('.block-layered-nav dt img').each(function (img){
        img.observe('mouseover', amshopby_tooltip_show);
        img.observe('mouseout', amshopby_tooltip_hide);
    });

    $$('.amshopby-slider-param').each(function (item) {
        var param = item.value.split(',');
        amshopby_slider(param[0], param[1], param[2], param[3], param[4], param[5]);
    });
}

function amshopby_price_click_callback(evt, step) {

    if (isNaN(step)) step=1;

    if (evt && evt.type == 'keypress' && 13 != evt.keyCode)
        return;

    var prefix = 'amshopby-price';
    // from slider
    if (typeof(evt) == 'string'){
        prefix = evt;
    }
    else {
        var el = Event.findElement(evt, 'input');
        if (!Object.isElement(el)){
            el = Event.findElement(evt, 'button');
        }
        prefix = el.name;
    }

    var a = prefix + '-from';
    var b = prefix + '-to';

    var numFrom = amshopby_price_format($(a).value, step);
    var numTo   = amshopby_price_format($(b).value, step);

    if ((numFrom < 0.01 && numTo < 0.01) || numFrom < 0 || numTo < 0) {
        return;
    }

    var url =  $(prefix +'-url').value.gsub(a, numFrom).gsub(b, numTo);
    amshopby_set_location(url);
}

function amshopby_price_focus_callback(evt){
    var el = Event.findElement(evt, 'input');
    if (isNaN(parseFloat(el.value))){
        el.value = '';
    }
}


function amshopby_price_format(num, step){
    num = parseFloat(num);

    if (isNaN(num))
        num = 0;

    if (step != 1.0) {
        return amshopby_round(num, step);
    } else {
        return Math.round(num);
    }
}


function amshopby_slider(from, to, max_value, prefix, min_value, step) {
    var slider = $(prefix);

    max_value = parseFloat(max_value);
    min_value = parseFloat(min_value);
    from = (from === "") ? min_value : parseFloat(from);
    to = (to === "") ? max_value : parseFloat(to);

    var width = parseFloat(slider.offsetWidth);
    if (!width) {
        // filter collapsed, we will wait
        setTimeout(function() {
            amshopby_slider(from, to, max_value, prefix, min_value, step);
        }, 200);
        return;
    }

    var ratePP = (max_value - min_value) / 100;

    var fromPixel = ((from - min_value) || (from - to != 0 || from != 0)) ? ((from - min_value) / ratePP) : 0;
    var toPixel = ((to - min_value) || (from - to != 0 || to != 0)) ? ((to - min_value) / ratePP) : 100;

    Control.Slider.prototype.translateToPx = function (value) {
        return value + '%';
    };

    Control.Slider.prototype.translateToValue = function (offset) {
        return ((offset/((this.maximumOffset() - this.minimumOffset())-this.handleLength) *
        (this.range.end-this.range.start)) + this.range.start);
    };

    Control.Slider.prototype.updateFinished = function () {
        if (Math.round(this.values[1]) == 100) {
            this.handles[0].addClassName('active');
        } else {
            if (this.handles[0].hasClassName('active')) {
                this.handles[0].removeClassName('active');
            }
        }
        if (this.initialized && this.options.onChange)
            this.options.onChange(this.values.length>1 ? this.values : this.value, this);
        this.event = null;
    };

    new Control.Slider(slider.select('.handle'), slider, {
        range: $R(0, 100),
        sliderValue: [fromPixel, toPixel],
        restricted: true,

        onChange: function (values){
            this.onSlide(values);
            var fromValue = amshopby_round(min_value + ratePP * values[0], step);
            var toValue   = amshopby_round(min_value + ratePP * values[1], step);
            if (fromValue != from || toValue != to) {
                amshopby_price_click_callback(prefix, step);
            }
        },
        onSlide: function amastyOnSlide(values) {
            if (isNaN(values[0]) || isNaN(values[1])) {
                return;
            }

            var fromValue = amshopby_round(min_value + ratePP * values[0], step);
            var toValue   = amshopby_round(min_value + ratePP * values[1], step);

            amshopby_update_slider_bar(prefix, values[0], values[1]);

            if ($(prefix+'-from')) {
                $(prefix+'-from').value = fromValue;
                $(prefix+'-to').value   = toValue;
            }

            if ($(prefix + '-from-slider')) {
                $(prefix + '-from-slider').update(fromValue);
                $(prefix + '-to-slider').update(toValue);
            }
        }
    });
    amshopby_update_slider_bar(prefix, fromPixel, toPixel);
}

function amshopby_round(value, step) {
    value /= step;
    value = parseInt(value);
    value *= step;
    return value;
}

function amshopby_update_slider_bar(prefix, fromPixel, toPixel) {
    if ($(prefix + '-slider-bar')) {
        var barWidth = toPixel - fromPixel;
        if (fromPixel == toPixel) {
            barWidth = 0;
        }
        $(prefix + '-slider-bar').setStyle({
            width : barWidth + '%',
            left : fromPixel + '%'
        });
    }
}

function amshopby_toggle(evt){
    var attr = Event.findElement(evt, 'a').id.substr(14);

    $$('.amshopby-attr-' + attr).invoke('toggle');

    $$('#amshopby-less-' + attr, '#amshopby-more-' + attr).invoke('toggle');

    Event.stop(evt);
    return false;
}

function amshopby_category_show(evt){
    var span = Event.findElement(evt, 'span');
    var id = span.id.substr(16);

    $$('.amshopby-cat-parentid-' + id).invoke('toggle');

    span.toggleClassName('minus');
    Event.stop(evt);

    return false;
}

function amshopby_filter_show(evt){
    var dt = Event.findElement(evt, 'dt');

    dt.next('dd').select('ol').each( function (e) {
        e.toggle()
    });
    dt.toggleClassName('amshopby-collapsed');

    Event.stop(evt);
    return false;
}

function amshopby_tooltip_show(evt){
    var img = Event.findElement(evt, 'img');
    var txt = img.alt;

    var tooltip = $(img.id + '-tooltip');
    if (!tooltip) {
        tooltip           = document.createElement('div');
        tooltip.className = 'amshopby-tooltip';
        tooltip.id        = img.id + '-tooltip';
        tooltip.innerHTML = img.alt;

        document.body.appendChild(tooltip);
    }

    var offset = Element.cumulativeOffset(img);
    tooltip.style.top  = offset[1] + 'px';
    tooltip.style.left = (offset[0] + 30) + 'px';
    tooltip.show();
}

function amshopby_tooltip_hide(evt){
    var img = Event.findElement(evt, 'img');
    var tooltip = $(img.id + '-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function amshopby_set_location(url){
    if (typeof amshopby_working != 'undefined' && !amshopby_ajax_fallback_mode()) {
        amshopby_ajax_push_state(url);
        return amshopby_ajax_request(url);
    }
    else {
        return setLocation(url);
    }
}

function amshopby_attr_highlight(li, str)
{
    /*
     * Remove previous highlight
     */
    amshopby_attr_unhighlight(li);

    var ch = li.childElements();
    if (ch.length >  0) {
        ch = ch[0];
        if (ch.tagName == 'A') {
            var img = '';
            if (li.readAttribute('img')) {
                img = li.readAttribute('img');
            }
            ch.innerHTML = img + li.readAttribute('data-text').replace(new RegExp(str,'gi'), '<span class="amshopby-hightlighted">' + str + '</span>');
        }
    }
}

function amshopby_attr_unhighlight(li)
{
    var ch = li.childElements();
    if (ch.length > 0) {
        ch = ch[0];
        if (ch.tagName == 'A') {
            var img = '';
            if (li.readAttribute('img')) {
                img = li.readAttribute('img');
            }
            ch.innerHTML = img + li.readAttribute('data-text');
        }
    }
}


function amshopby_attr_search(searchBox){
    var str = searchBox.value.toLowerCase();
    var all = searchBox.up(1).childElements();

    all.each(function(li) {
        if (li.hasAttribute('data-text')) {
            var val = li.getAttribute('data-text').toLowerCase();
            if (!val || val == 'search' || val.indexOf(str) > -1) {
                if (str != '' && val.indexOf(str) > -1) {
                    amshopby_attr_highlight(li, str);
                } else {
                    amshopby_attr_unhighlight(li);
                }
                li.show();
            }
            else {
                amshopby_attr_unhighlight(li);
                li.hide();
            }
        }
    });
}



document.observe("dom:loaded", function() { amshopby_start(); });