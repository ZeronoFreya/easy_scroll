
export default {
    scrollAxis: {
        type: String,
        default: 'xy',
        validator: (value) => ['x', 'y', 'xy'].includes(value)
    },
    scrollBar: {
        type: Boolean,
        default: true
    },
    scrollJoy: {
        type: Boolean,
        default: false
    },
    midMouseNav: {
        type: Boolean,
        default: false
    },
    overTip: {
        type: Boolean,
        default: false
    },
}