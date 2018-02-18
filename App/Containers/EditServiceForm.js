// @flow

import React from 'react'
import {
  TouchableOpacity,
  Keyboard,
  Picker,
  LayoutAnimation
} from 'react-native'
import { connect } from 'react-redux'
import PropTypes from 'prop-types';
import Styles from './Styles/EditServiceFormStyle'
import {Images, Metrics} from '../Themes'
import ServiceActions from '../Redux/ServiceRedux'
import CategoryActions from '../Redux/CategoryRedux'
import { Actions as NavigationActions } from 'react-native-router-flux'
import {
  Content,
  Container,
  Card,
  CardItem,
  Input,
  Button,
  Text,
  Form,
  Toast,
  Item,
  Label
} from 'native-base'
import CommonHeader from '../Components/CommonHeader'
import NamedLogo from '../Components/NamedLogo'
import I18n from 'react-native-i18n'
import ServicePhotos from './ServicePhotoUploader'

ServicePostProps = {
  dispatch: PropTypes.func,
  fetching: PropTypes.bool,
  attemptServicePost: PropTypes.func,
  profile: PropTypes.object,
  categories: PropTypes.object
}

class EditServiceForm extends React.Component {
  props: ServicePostProps

  state: {
    title: string,
    description: string,
    category: number,
    seed_price: number,
    visibleHeight: number,
    uuid: string,
    topLogo: {
      width: number
    },
    fetching: boolean
  }

  isAttempting: boolean
  keyboardDidShowListener: Object
  keyboardDidHideListener: Object

  constructor (props: ServicePostProps) {
    super(props)
    this.state = {
      title: '',
      description: '',
      category: null,
      seedsPrice: '1',
      visibleHeight: Metrics.screenHeight,
      fetching: false,
      uuid: null
    }
    this.isAttempting = false
  }

  assignServiceToState (service) {
    this.state.title = service.title
    this.state.description = service.description
    this.state.seedsPrice = String(service.seeds_price)
    this.state.category = service.category.id
    this.state.uuid = service.uuid
  }

  componentWillReceiveProps (newProps) {
    if (newProps.service) {
      // Update form with service values
      this.assignServiceToState(newProps.service)
    }
  }

  componentWillMount () {
    // Using keyboardWillShow/Hide looks 1,000 times better, but doesn't work on Android
    // TODO: Revisit this if Android begins to support - https://github.com/facebook/react-native/issues/3468 or https://github.com/facebook/react-native/issues/14275
    this.props.clearNewService()
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow)
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide)

    this.state.new
    if (this.props.uuid) {
      // Editing a service
      if (this.props.service) {
        this.assignServiceToState(this.props.service)
      } else {
        this.props.retrieveService(this.props.uuid)
      }
    }

    // If not categories loaded, load them
    if (!this.props.categories) {
      this.props.retrieveCategories()
    }
  }

  componentWillUnmount () {
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()

    this.props.clearNewService()
  }

  keyboardDidShow = (e) => {
    // Animation types easeInEaseOut/linear/spring
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    let newSize = Metrics.screenHeight - e.endCoordinates.height
    this.setState({
      visibleHeight: newSize,
      topLogo: {width: 100, height: 70}
    })
  }

  keyboardDidHide = (e) => {
    // Animation types easeInEaseOut/linear/spring
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    this.setState({
      visibleHeight: Metrics.screenHeight,
      topLogo: {width: Metrics.screenWidth}
    })
  }

  handlePressPost = () => {
    var { title, description, category, seedsPrice, uuid } = this.state
    this.isAttempting = true
    // attempt a login - a saga is listening to pick it up from here.

    if (!uuid) {
      uuid = this.props.newService
    }
    this.props.attemptServicePost(title, description, category, seedsPrice, uuid)
  }

  handlePressDelete = () => {
    if (this.props.uuid) {
      this.props.attemptServiceDelete(this.props.uuid)
    } else if (this.props.newService) {
      this.props.attemptServiceDelete(this.props.newService)
    }

    Toast.show({
      text: I18n.t('Offer Deleted'),
      position: 'bottom',
      buttonText: 'Okay'
    })

    NavigationActions.profile()
  }

  handleChangeTitle = (text) => {
    this.setState({ title: text })
  }

  handleChangeDescription = (text) => {
    this.setState({ description: text })
  }

  handleChangeSeedsPrice = (text) => {
    this.setState({ seedsPrice: text })
  }

  handleChangeCategory = (itemValue, itemIndex) => {
    this.setState({ category: itemValue })
  }

  renderDeleteButton () {
    if ((this.props.uuid) || (this.props.newService)) {
      return (
        <Button
          block
          danger
          onPress={this.handlePressDelete}
        >
          <Text> {I18n.t('Delete Service')} </Text>
        </Button>
      )
    } else {
      return (<Content />)
    }
  }

  renderGoToServiceButton() {
    if (!(this.props.uuid) && (this.props.newService)) {
      return (
        <Button
          block
          info 
          onPress={() => NavigationActions.service({uuid: this.props.newService})}
        >
          <Text> {I18n.t('View Service')} </Text>
        </Button>
      )
    } else {
      return (<Content />)
    }
  }

  renderPublishButtonText () {
    if (this.props.posting) {
      return (
        <Text >{I18n.t('Publishing')}</Text>
      )
    } else if (!(this.props.error) && (this.props.newService)) {
      return (
        <Text >{I18n.t('Published')}</Text>
      )
    } else {
      return (
        <Text >{I18n.t('Publish')}</Text>
      )
    }
  }

  renderPickerCategories () {
    if (this.props.categories) {
      return (this.props.categories.map((item, itemKey) =>
        <Picker.Item label={item.name} value={item.id} key={itemKey} />
      ))
    } else {
      return (<Picker.Item label={'Loading Categories'} value={-1} key={0} />)
    }
  }

  render () {
    const { title, description, category, seedsPrice } = this.state // TODO: Add category
    const { fetching } = this.state
    const editable = !fetching
    const descriptionTextInputStyle = editable ? Styles.descriptionTextInput : Styles.descriptionTextInputReadonly
    return (

      <Container>
        <CommonHeader title={I18n.t('Service')} />
        <Content padder>
          <Card>
            <NamedLogo />
            <Form>
              <Item floatingLabel>
                <Label>{I18n.t('Title')}</Label>
                <Input
                ref='title'
                value={title}
                editable={editable}
                keyboardType='default'
                returnKeyType='next'
                autoCapitalize='sentences'
                autoCorrect={false}
                onChangeText={this.handleChangeTitle}
                underlineColorAndroid='transparent'
                onSubmitEditing={() => this.refs.description.focus()}
                />
              </Item>
                <Text style={Styles.errorLabel}>
                  { (this.props.error && this.props.error.title) ? this.props.error['title'][0] : ''}
                </Text>

             <Item floatingLabel>
              <Label>{I18n.t('Description')}</Label>
              <Input
                ref='description'
                style={descriptionTextInputStyle}
                value={description}
                editable={editable}
                keyboardType='default'
                returnKeyType='next'
                autoCapitalize='sentences'
                multiline={true}
                autoCorrect
                onChangeText={this.handleChangeDescription}
                numberOfLines={8}
                underlineColorAndroid='transparent'
                onSubmitEditing={() => this.refs.seedsPrice.focus()}
                />
            </Item>
              <Text style={Styles.errorLabel}>
                { (this.props.error && this.props.error.description) ? this.props.error['description'][0] : ''}
              </Text>

            <Picker
              selectedValue={category} // bien
              onValueChange={(itemValue) => this.setState({category: itemValue})}
              enabled={editable} // Bien
              prompt={I18n.t('Category')} // bien
            >
              {this.renderPickerCategories()}
            </Picker>
            <Text style={Styles.errorLabel}>
              { (this.props.error && this.props.error.category) ? this.props.error['category'][0] : ''}
            </Text>
          <Text style={Styles.errorLabel}>
            { (this.props.error && this.props.error.non_field_errors) ? this.props.error['non_field_errors'][0] : ''}
          </Text>


          <Item floatingLabel>
            <Label>{I18n.t('Price')}</Label>
            <Input
              ref='seedsPrice'
              value={seedsPrice}
              editable={editable}
              keyboardType='numeric'
              returnKeyType='next'
              autoCorrect={false}
              onChangeText={this.handleChangeSeedsPrice}
              underlineColorAndroid='transparent'
              onSubmitEditing={this.handlePressPost}
              />
            </Item>
              <Text style={Styles.errorLabel}>
                { (this.props.error && this.props.error.seeds_price) ? this.props.error['seeds_price'][0] : ''}
              </Text>
            <Text style={Styles.errorLabel}>
              { (this.props.error && this.props.error.non_field_errors) ? this.props.error['non_field_errors'][0] : ''}
            </Text>

            </Form>
            <ServicePhotos serviceUuid={this.props.uuid ? this.props.uuid : this.props.newService} />
            {this.renderDeleteButton()}
            <Button
              block
              onPress={this.handlePressPost}
              >
                {this.renderPublishButtonText()}
            </Button>
            {this.renderGoToServiceButton()}
          </Card>
        </Content>
      </Container>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    fetching: state.services.fetching,
    posting: state.services.posting,
    error: state.services.error,
    uuid: ownProps.uuid,
    service: state.services.items[ownProps.uuid],
    newService: state.services.newService,
    categories: state.category.categories,
    deleting: state.services.deleting
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    attemptServicePost:
      (title, description, category, seedsPrice, uuid) => dispatch(
        ServiceActions.servicePostRequest(
          title,
          description,
          category,
          seedsPrice,
          uuid
        )
      ),
    attemptServiceDelete:
      (uuid) => dispatch(ServiceActions.serviceDeletionRequest(uuid)),
    retrieveService: (uuid) => dispatch(ServiceActions.serviceRequest(uuid)),
    retrieveCategories: () => dispatch(CategoryActions.categoryRequest()),
    clearNewService: () => dispatch(ServiceActions.clearNewService())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditServiceForm)
