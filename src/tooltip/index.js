import * as React from 'react';
import {
    TouchableOpacity,
    Modal,
    View,
    ViewPropTypes as RNViewPropTypes,
    Text
} from 'react-native';
import PropTypes from 'prop-types';

import { ScreenWidth, ScreenHeight, isIOS } from './helpers'
import getTooltipCoordinate from './getTooltipCoordinate';

const ViewPropTypes = RNViewPropTypes || View.propTypes;

class Tooltip extends React.Component {
    state = {
        isVisible: false,
        yOffset: 0,
        xOffset: 0,
        elementWidth: 0,
        elementHeight: 0,
    };

    renderedElement;
    timeout;

    toggleTooltip = () => {
        const { onClose } = this.props;
        this.getElementPosition();
        this.setState(prevState => {
            if (prevState.isVisible && !isIOS) {
                onClose && onClose();
            }

            return { isVisible: !prevState.isVisible };
        });
    };

    wrapWithAction = (actionType, children) => {
        switch (actionType) {
            case 'press':
                return (
                    <TouchableOpacity
                        onPress={this.toggleTooltip}
                        activeOpacity={1}
                        style={[this.state.isVisible ? styles.pointPressed : styles.point, { top: this.props.position.top, left: this.props.position.left }]}
                    >
                        {children}
                    </TouchableOpacity >
                );
            case 'longPress':
                return (
                    <TouchableOpacity
                        onLongPress={this.toggleTooltip}
                        activeOpacity={1}
                        {...this.props.toggleWrapperProps}
                    >
                        {children}
                    </TouchableOpacity>
                );
            default:
                return children;
        }
    };

    getTooltipStyle = () => {
        const { yOffset, xOffset, elementHeight, elementWidth } = this.state;
        const {
            height,
            backgroundColor,
            width,
            withPointer,
            containerStyle,
            position
        } = this.props;

        let pointTop = position.top + yOffset;
        let pointLeft = position.left + xOffset;

        const { x, y } = getTooltipCoordinate(
            pointLeft,
            pointTop,
            elementWidth,
            elementHeight,
            ScreenWidth,
            ScreenHeight,
            width,
            height,
            withPointer,
        );


        return {
            position: 'absolute',
            left: x,
            top: y,
            width,
            height: "auto",
            backgroundColor,
            // default styles
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            borderRadius: 5,
            padding: 10,
            ...containerStyle,
        };
    };

    renderContent = withTooltip => {
        const { popover, withPointer, highlightColor, actionType, position } = this.props;

        if (!withTooltip)
            return this.wrapWithAction(actionType, this.props.children);

        const { yOffset, xOffset, elementWidth, elementHeight } = this.state;
        const tooltipStyle = this.getTooltipStyle();
        return (
            <View>
                <View style={tooltipStyle}><Text>{popover}</Text></View>
            </View>
        );
    };

    componentDidMount () {
        // wait to compute onLayout values.
        this.timeout = setTimeout(this.getElementPosition, 500);
    }

    componentWillUnmount () {
        clearTimeout(this.timeout);
    }

    getElementPosition = () => {
        this.renderedElement &&
            this.renderedElement.measureInWindow(
                (pageOffsetX, pageOffsetY, width, height) => {
                    console.log(this.props.position.offsetX + ":" + this.props.position.offsetY);
                    console.log(pageOffsetX + "," + pageOffsetY + "," + width + "," + height)
                    this.setState({
                        xOffset: pageOffsetX,
                        yOffset: pageOffsetY,
                        elementWidth: width,
                        elementHeight: height,
                    });
                },
            );
    };

    render () {
        const { isVisible } = this.state;
        const { onClose, withOverlay, onOpen, overlayColor, position } = this.props;
        //由于安卓中视图外的元素不会进行绘制导致有一些屏幕外的元素无法获得真实的偏移值，只要在View上把collapsable={false}这个属性加上去既可以解决。
        //加上这个就能获取该view在屏幕中的位置，但加上collapsable后安卓机型无法在该view内部组件监听点击事件。因此在外部再包一个view即可解决。
        return (
            <View>
                <View collapsable={false} ref={e => (this.renderedElement = e)}></View>
                {this.renderContent(false)}
                <Modal
                    animationType="fade"
                    visible={isVisible}
                    transparent
                    onDismiss={onClose}
                    onShow={onOpen}
                    onRequestClose={onClose}
                >
                    <TouchableOpacity
                        style={styles.container(withOverlay, overlayColor)}
                        onPress={this.toggleTooltip}
                        activeOpacity={1}
                    >
                        {this.renderContent(true)}
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    }
}

Tooltip.propTypes = {
    children: PropTypes.element,
    withPointer: PropTypes.bool,
    popover: PropTypes.element,
    height: PropTypes.number,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    containerStyle: ViewPropTypes.style,
    pointerColor: PropTypes.string,
    pointerStyle: PropTypes.object,
    onClose: PropTypes.func,
    onOpen: PropTypes.func,
    withOverlay: PropTypes.bool,
    toggleWrapperProps: PropTypes.object,
    overlayColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    highlightColor: PropTypes.string,
    actionType: PropTypes.oneOf(['press', 'longPress', 'none']),
};

Tooltip.defaultProps = {
    toggleWrapperProps: {},
    withOverlay: false,
    highlightColor: 'transparent',
    withPointer: true,
    actionType: 'press',
    height: 40,
    width: 150,
    containerStyle: {},
    pointerStyle: {},
    backgroundColor: 'rgba(255,255,255,0.95)',
    onClose: () => { },
    onOpen: () => { },
};

const styles = {
    container: (withOverlay, overlayColor) => ({
        backgroundColor: withOverlay
            ? overlayColor
                ? overlayColor
                : 'rgba(250, 250, 250, 0.95)'
            : 'transparent',
        flex: 1,
    }),
    point: {
        position: "absolute",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "white",
        height: 20,
        width: 20,
        backgroundColor: "#F43E3E"
    },
    pointPressed: {
        position: "absolute",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "white",
        height: 20,
        width: 20,
        backgroundColor: "#A50707"
    }

};

export default Tooltip;