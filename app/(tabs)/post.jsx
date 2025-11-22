import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Chip, Dialog, Portal, SegmentedButtons, Snackbar, Text, TextInput } from "react-native-paper";
import { Dropdown } from 'react-native-paper-dropdown';
import EditableImage from "../../components/EditableImage";
import LocationSearch from "../../components/LocationSearch";
import { auth, db, firebaseStorage } from '../../firebaseConfig';

export default function Post() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const imagePathRef = useRef(`posts/${Date.now()}.jpg`);
  
  const TAG_OPTIONS = [
    'Electronics',
    'Furniture',
    'Kitchenware',
    'Study Supplies',
    'Clothing & Accessories',
    'Appliances',
    'Personal Care'
  ];
  const AVAILABILITY_OPTIONS = [
    { label: '1 month', value: '1 month' },
    { label: '3 months', value: '3 months' },
    { label: '6 months', value: '6 months' },
    { label: '1 year', value: '1 year' },
    { label: '3 years', value: '3 years' },
    { label: '3+ years', value: '3+ years' },
    { label: 'Not decided / Negotiable', value: 'Not decided / Negotiable' },
  ];

  const RECURRENCE_OPTIONS = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const [postData, setPostData] = useState({
    title: '',
    description: '',
    image: null,
    location: null,
    tags: [],
    sellingPrice: type === 'sell' ? '' : null,
    rentalPrice: type === 'rent' ? '' : null,
    rentalPriceUnit: type === 'rent' ? 'month' : null,
    rentalPriceDuration: type === 'rent' ? 'Not decided / Negotiable' : null,
    rentalPriceDeposit: type === 'rent' ? '' : null,
  });
  const [showTagLimit, setShowTagLimit] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showDialog = (title, message) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };
  const hideDialog = () => setDialogVisible(false);

  const toggleTag = (tag) => {
    setPostData((prev) => {
      const isSelected = prev.tags.includes(tag);
      if (!isSelected && prev.tags.length >= 3) {
        setShowTagLimit(true);
        return prev; 
      }
      return {
        ...prev,
        tags: isSelected
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag]
      };
    });
  };

  const handleNumericInput = (text, field) => {
    if (/^\d*\.?\d*$/.test(text)) {
      setPostData(prev => ({ ...prev, [field]: text }));
    }
  };

  const handleSubmit = async () => {
    const { title, description, image, location, sellingPrice, rentalPrice, rentalPriceUnit, rentalPriceDuration } = postData;
    const missingFields = [];
    if (!title) missingFields.push('Title');
    if (!image) missingFields.push('Image');
    if (!location) missingFields.push('Location'); 
    if (type === 'sell' && !sellingPrice) missingFields.push('Price');
    if (type === 'rent') {
      if (!rentalPrice) missingFields.push('Price');
      if (!rentalPriceUnit) missingFields.push('Price Unit');
    }
    if (missingFields.length > 0) {
      showDialog('Missing Information', `Please fill out the following fields: ${missingFields.join(', ')}`);
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) {
        showDialog('Error', 'You must be logged in to create a post.');
        return;
      }
      let imageUrl = postData.image;
      if (postData.image && (postData.image.startsWith('file://') || postData.image.startsWith('data:'))) {
        const response = await fetch(postData.image);
        const blob = await response.blob();
        const storageRef = ref(firebaseStorage, imagePathRef.current);
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, 'posts'), {
        ...postData,
        image: imageUrl,
        userId: user.uid,
        createdAt: serverTimestamp(),
        postType: type,
      });
      setSuccessMessage('Post submitted successfully!');
      setSuccessVisible(true);
      setTimeout(() => {
        router.back();
      }, 500);
      setPostData(prev => ({
        ...prev,
        title: '',
        description: '',
        image: null,
        tags: [],
        sellingPrice: type === 'sell' ? '' : null,
        rentalPrice: type === 'rent' ? '' : null,
        rentalPriceUnit: type === 'rent' ? 'month' : null,
        rentalPriceDuration: type === 'rent' ? '' : null,
        rentalPriceDeposit: type === 'rent' ? '' : null,
        location: null,
      }));
    } catch (e) {
      console.error('Error adding document: ', e);
      showDialog('Error', 'There was an error submitting your post.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        data={[]}
        scrollEnabled={true}
        removeClippedSubviews={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        ListHeaderComponent={
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.header}>
              Create a New Listing
            </Text>
            <Text variant="bodyMedium" style={styles.componentDescription}>
              You have selected to {type} an item. Please provide the details below.
            </Text>
            <SegmentedButtons
              value={type}
              style={styles.segmentedButtons}
              onValueChange={(value) => router.replace(`/post?type=${value}`)}
              buttons={[
                { value: 'sell', label: 'Sell' },
                { value: 'donate', label: 'Donate' },
                { value: 'rent', label: 'Rent' },
              ]}
            />
            <Text variant="titleMedium" style={styles.label}>
              Upload Image
            </Text>
            <View style={styles.imageContainer}>
              <EditableImage
                imageUri={postData.image}
                setImageUri={(uri) => setPostData((prev) => ({ ...prev, image: uri }))}
                imagePath={imagePathRef.current}
                editable={true}
                style={styles.image}
              />
            </View>
            <Text variant="titleMedium" style={styles.label}>
              Product Name
            </Text>
            <TextInput
              mode="outlined"
              value={postData.title}
              onChangeText={(text) => setPostData(prev => ({ ...prev, title: text }))}
              style={styles.input}
            />
            <Text variant="titleMedium" style={styles.label}>
              Product Description
            </Text>
            <TextInput
              mode="outlined"
              value={postData.description}
              onChangeText={(text) => setPostData(prev => ({ ...prev, description: text }))}
              style={styles.descriptionInput}
              multiline
            />
            {type === 'sell' && (
              <>
                <Text variant="titleMedium" style={styles.label}>
                  Price
                </Text>
                <TextInput
                  mode="outlined"
                  label="HKD"
                  value={postData.sellingPrice}
                  onChangeText={(text) => handleNumericInput(text, 'sellingPrice')}
                  style={styles.input}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon="currency-usd" />}
                />
              </>
            )}
            {type === 'donate' && (
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={25}
                  color="#49454F"
                  style={{ margin: 3 }}
                />
                <Text variant="titleMedium" style={styles.label}>
                  This item will be listed as Free
                </Text>
              </View>
            )}
            {type === 'rent' && (
              <>
                <View style={styles.rentalPriceContainer}>
                  <View style={{ margin: 4, width: '45%', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Text variant="titleMedium" style={styles.label}>
                      Price
                    </Text>
                    <TextInput
                      mode="outlined"
                      label="HKD"
                      value={postData.rentalPrice}
                      onChangeText={(text) => handleNumericInput(text, 'rentalPrice')}
                      keyboardType="numeric"
                      left={<TextInput.Icon icon="currency-usd" />}
                      style={{ width: '100%' }}
                    />
                  </View>
                  <View style={{ margin: 4, width: '45%', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Text variant="titleMedium" style={styles.label}>
                      Recurring
                    </Text>
                    <Dropdown
                      options={RECURRENCE_OPTIONS}
                      value={postData.rentalPriceUnit}
                      onSelect={(value) => setPostData(prev => ({ ...prev, rentalPriceUnit: value }))}
                      style={styles.rentalPriceItem}
                    />
                  </View>
                </View>
                <View style={{ width: '100%', marginTop: 16 }}>
                  <Text variant="titleMedium" style={styles.label}>
                    Deposit
                  </Text>
                  <TextInput
                    mode="outlined"
                    label="HKD"
                    value={postData.rentalPriceDeposit}
                    onChangeText={(text) => handleNumericInput(text, 'rentalPriceDeposit')}
                    keyboardType="numeric"
                    left={<TextInput.Icon icon="currency-usd" />}
                    style={{ marginBottom: 16 }}
                  />
                  <Text variant="titleMedium" style={styles.label}>
                    Duration
                  </Text>
                  <View style={{ width: '100%' }}>
                    <Dropdown
                      options={AVAILABILITY_OPTIONS}
                      value={postData.rentalPriceDuration}
                      onSelect={(value) => setPostData(prev => ({ ...prev, rentalPriceDuration: value }))}
                    />
                  </View>
                </View>
              </>
            )}
            <View style={{ width: '100%', marginTop: 40 }}>
              <Text variant="titleMedium" style={styles.label}>
                Meetup Location
              </Text>
              <Text variant="bodyMedium" style={styles.componentDescription}>
                Choose a location where you would like to meet the buyer/donee/renter.
              </Text>
              <LocationSearch
                onSelect={(loc) => {
                  setPostData((prev) => ({ ...prev, location: loc }));
                }}
                style={styles.input}
              />
            </View>
            <Text variant="titleMedium" style={[styles.label, { marginTop: 40 }]}>
              Categories
            </Text>
            <Text variant="bodyMedium" style={styles.componentDescription}>
              Choose up to 3 tags that best describe your item.
            </Text>
            <View style={styles.chipContainer}>
              {TAG_OPTIONS.map((tag) => {
                const selected = postData.tags.includes(tag);
                const limitReached = postData.tags.length >= 3;
                return (
                  <Chip
                    key={tag}
                    mode="outlined"
                    selected={selected}
                    onPress={() => toggleTag(tag)}
                    disabled={limitReached && !selected}
                    style={[styles.chip, selected && styles.chipSelected]}
                    textStyle={selected && styles.chipSelectedText}
                  >
                    {tag}
                  </Chip>
                );
              })}
            </View>
            <Snackbar
              visible={showTagLimit}
              onDismiss={() => setShowTagLimit(false)}
              duration={2000}
            >
              Maximum 3 categories allowed
            </Snackbar>
          </View>
        }
      />
    <Button 
      mode="contained"
      style={{ margin: 8, width: "35%", alignSelf: 'flex-end', borderRadius: 4, height: 45 }} 
      onPress={() => {handleSubmit()}}
    >
      Submit
    </Button>
    <Portal>
      <Dialog visible={dialogVisible} onDismiss={hideDialog}>
        <Dialog.Title variant="bodyLarge" style={styles.header}>{dialogTitle}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.componentDescription}>{dialogMessage}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button 
            onPress={hideDialog}
            style={{ margin: 16, fontSize: 20}}
          >
              OK
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
    <Snackbar
      visible={successVisible}
      onDismiss={() => setSuccessVisible(false)}
      duration={2500}
      style={{ backgroundColor: '#2e7d32' }}
    >
      {successMessage}
    </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 0
  },
  descriptionInput: {
    marginBottom: 16,
    minHeight: 140,
  },
  label: {
    marginBottom: 4,
  },
  componentDescription: {
    marginBottom: 20,
    color: '#49454F',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    height: 180,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E2E6',
    padding: 12,
    borderRadius: 8,
  },
  rentalPriceContainer: {
    marginBottom: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    height: 80,
  },
  rentalPriceItem: {
    flex: 1,
    margin: 4,
    width: '40%'
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  chip: {
    margin: 4,
    borderColor: '#6750A4',
  },
  chipSelected: {
    backgroundColor: 'rgba(103,80,164,0.16)',
    borderColor: '#6750A4',
  },
  chipSelectedText: {
    color: '#000000',
  },
});
