import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, StyleSheet, View } from "react-native";
import { Button, Chip, Dialog, Portal, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { Dropdown } from 'react-native-paper-dropdown';
import EditableImage from "../../components/EditableImage";
import LocationSearch from "../../components/LocationSearch";
import AppSnackbar from "../../components/Snackbar";
import { auth, db, firebaseStorage } from '../../firebaseConfig';

export default function Post() {
  const { type, id } = useLocalSearchParams(); 
  const router = useRouter();
  const imagePathRef = useRef(`posts/${Date.now()}.jpg`);
  const theme = useTheme();
  
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
  const [loading, setLoading] = useState(false);
  
  const handleNumericInput = (text, field) => {
    if (/^\d*\.?\d*$/.test(text)) {
      setPostData(prev => ({ ...prev, [field]: text }));
    }
  };
    useEffect(() => {
      async function fetchPost() {
        if (id) {
          setLoading(true);
          const ref = doc(db, 'posts', id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setPostData({
              title: data.title || '',
              description: data.description || '',
              image: data.image || null,
              location: data.location || null,
              tags: Array.isArray(data.tags) ? data.tags : [],
              sellingPrice: data.sellingPrice || '',
              rentalPrice: data.rentalPrice || '',
              rentalPriceUnit: data.rentalPriceUnit || 'month',
              rentalPriceDuration: data.rentalPriceDuration || 'Not decided / Negotiable',
              rentalPriceDeposit: data.rentalPriceDeposit || '',
            });
          }
          setLoading(false);
        }
      }
      fetchPost();
    }, [id]);
  const [showTagLimit, setShowTagLimit] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

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
      if (id) {
        // Edit mode: update existing post
        const ref = doc(db, 'posts', id);
        await updateDoc(ref, {
          ...postData,
          image: imageUrl,
          postType: type,
        });
        setSuccessMessage('Post updated successfully!');
        setSuccessVisible(true);
        setTimeout(() => {
          router.replace('/profile');
        }, 500);
      } else {
        // Create mode: add new post
        await addDoc(collection(db, 'posts'), {
          ...postData,
          image: imageUrl,
          userId: user.uid,
          createdAt: serverTimestamp(),
          postType: type,
          status: 'available',
        });
        setSuccessMessage('Post submitted successfully!');
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
        setSuccessVisible(true);
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 500);
      }
    } catch (e) {
      console.error('Error saving document: ', e);
      showDialog('Error', 'There was an error saving your post.');
    }
  };

  // Add state for delete confirmation dialog
  const handleDelete = () => {
    setDeleteDialogVisible(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    setDeleteDialogVisible(false);
    if (!id) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'posts', id));
      if (postData.image && postData.image.startsWith('https://')) {
        const imageRef = ref(firebaseStorage, imagePathRef.current);
        try {
          await deleteObject(imageRef);
        } catch (e) {
          // Ignore if image not found
        }
      }
      setSuccessMessage('Post deleted successfully!');
      setSuccessVisible(true);
      setTimeout(() => {
        router.replace('/profile');
      }, 500);
    } catch (e) {
      showDialog('Error', 'There was an error deleting your post.');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      style={[styles.keyboardView, { backgroundColor: theme.colors.background }]}
      behavior={"height"}
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
              {id ? 'Edit Listing' : 'New Listing'}
            </Text>
            <Text variant="bodyMedium" style={[styles.componentDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              You have selected to {type} an item. Please provide the details below.
            </Text>
            <SegmentedButtons
              value={type}
              style={styles.segmentedButtons}
              onValueChange={(value) => router.replace(id ? `/post?type=${value}&id=${id}` : `/post?type=${value}`)}
              buttons={[
                { value: 'sell', label: 'Sell', checkedColor: theme.colors.onPrimary, style: type === 'sell' ? { backgroundColor: theme.colors.primary } : {} },
                { value: 'donate',label: 'Donate', checkedColor: theme.colors.onPrimary, style: type === 'donate' ? { backgroundColor: theme.colors.primary } : {} },
                { value: 'rent', label: 'Rent', checkedColor: theme.colors.onPrimary, style: type === 'rent' ? { backgroundColor: theme.colors.primary } : {} },
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
              <View style={[styles.infoBox, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Ionicons
                  name="information-circle-outline"
                  size={25}
                  color={theme.colors.onTertiaryContainer}
                  style={{ margin: 3 }}
                />
                <Text variant="titleMedium" style={[{ fontWeight: 600, color: theme.colors.onTertiaryContainer }]}>
                  This item will be listed as Free
                </Text>
              </View>
            )}
            {type === 'rent' && (
              <>
                <View style={styles.rentalPriceContainer}>
                  <View style={{ flex: 1, marginHorizontal: 4 }}>
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
                      style={{ width: '100%', height: 56 }}
                    />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 4 }}>
                    <Text variant="titleMedium" style={{marginBottom: 10}}>
                      Recurring
                    </Text>
                    <Dropdown
                      mode="outlined"
                      hideMenuHeader
                      options={RECURRENCE_OPTIONS}
                      value={postData.rentalPriceUnit}
                      onSelect={(value) => setPostData(prev => ({ ...prev, rentalPriceUnit: value }))}
                      style={styles.rentalPriceItem}
                      dropDownStyle={{ backgroundColor: theme.colors.surface }}
                      selectedItemLabelStyle={{ color: theme.colors.primary }}
                      dropDownItemSelectedTextStyle={{ color: theme.colors.onPrimaryContainer }}
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
                    style={{ marginBottom: 24 }}
                  />
                  <Text variant="titleMedium" style={styles.label}>
                    Duration
                  </Text>
                  <View style={{ width: '100%' }}>
                    <Dropdown
                      mode="outlined"
                      hideMenuHeader
                      options={AVAILABILITY_OPTIONS}
                      value={postData.rentalPriceDuration}
                      onSelect={(value) => setPostData(prev => ({ ...prev, rentalPriceDuration: value }))}
                    />
                  </View>
                </View>
              </>
            )}
            <View style={{ width: '100%', marginTop: 32 }}>
              <Text variant="titleMedium" style={styles.label}>
                Meetup Location
              </Text>
              <Text variant="bodyMedium" style={[styles.componentDescription, { color: theme.colors.onSurfaceVariant }]}>
                Choose a location where you would like to meet the buyer/donee/renter.
              </Text>
              <LocationSearch
                onSelect={(loc) => {
                  setPostData((prev) => ({ ...prev, location: loc }));
                }}
                style={styles.input}
              />
            </View>
            <Text variant="titleMedium" style={[styles.label, { marginTop: 32 }]}>
              Categories
            </Text>
            <Text variant="bodyMedium" style={[styles.componentDescription, { color: theme.colors.onSurfaceVariant }]}>
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
                    selectedColor={theme.colors.primary}
                    icon={() => (<Ionicons name={selected ? "checkmark" : null} size={16} color={selected ? theme.colors.onPrimaryContainer : theme.colors.primary} />)}
                    style={[
                      styles.chip,
                      { borderColor: theme.colors.primary },
                      selected && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                    textStyle={selected && { color: theme.colors.onPrimaryContainer }}
                  >
                    {tag}
                  </Chip>
                );
              })}
            </View>

            {showTagLimit && (
              <Text variant="bodyMedium" style={{ color: theme.colors.error, marginBottom: 16 }}>
                You can select up to 3 tags only.
              </Text>
            )}

          </View>
        }
      />
    {id ? (
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, paddingHorizontal: 24 }}>
        <Button 
          mode="outlined"
          style={{ margin: 8, width: "48%", alignSelf: 'center', borderRadius: 16, height: 45, justifyContent: 'center' }} 
          onPress={handleDelete}
          icon="trash-can-outline"
        >
          Delete
        </Button>
        <Button 
          mode="contained"
          style={{
            margin: 8,
            width: "48%",
            alignSelf: 'center',
            borderRadius: 16,
            height: 45,
            justifyContent: 'center'
          }} 
          onPress={handleSubmit}
        >
          Submit
        </Button>
      </View>
    ) : (
      <View style={{ marginBottom: 16, paddingHorizontal: 24, alignItems: 'center' }}>
        <Button 
          mode="contained"
          style={{
            margin: 8,
            width: "100%",
            borderRadius: 16,
            height: 45,
            justifyContent: 'center'
          }} 
          onPress={handleSubmit}
        >
          Submit
        </Button>
      </View>
    )}
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
      {/* Delete confirmation dialog */}
      <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
        <Dialog.Title style={styles.header}>Are you sure?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.componentDescription}>
            This action will permanently delete your post and its image. Are you sure you want to continue?
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDeleteDialogVisible(false)} style={{ margin: 8 }}>
            Cancel
          </Button>
          <Button onPress={confirmDelete} style={{ margin: 8 }} mode="contained">
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>

    <AppSnackbar
      visible={successVisible}
      onDismiss={() => setSuccessVisible(false)}
      message={successMessage}
      type="success"
      duration={2500}
    />

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
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '800',
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 8,
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
    padding: 12,
    borderRadius: 8,
  },
  rentalPriceContainer: {
    marginBottom: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  rentalPriceItem: {
    width: '100%'
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  chip: {
    margin: 4,
  },
  chipSelected: {
  },
  chipSelectedText: {
  },
});