import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Menu, Portal, Text, TextInput } from 'react-native-paper';
import { auth, db, storage } from '../firebaseConfig';
import EditableImage from './EditableImage';
import LocationSearch from './LocationSearch';

const CreatePost = ({ type, onPostSuccess }) => {

    const TAG_OPTIONS = [
        'Electronics',
        'Furniture',
        'Kitchenware',
        'Study Supplies',
        'Clothing & Accessories',
        'Appliances',
        'Personal Care'
    ];

    const DURATION_OPTIONS = [
        '1 month',
        '3 months',
        '6 months',
        '1 year',
        '3 years',
        '3+ years',
        'Not decided / Negotiable'
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
        rentalPriceDuration: type === 'rent' ? '' : null,
        rentalPriceDeposit: type === 'rent' ? '' : null
    });

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');

    const showDialog = (title, message) => {
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const hideDialog = () => setDialogVisible(false);

    const handleNumericInput = (text, field) => {
        if (/^\d*\.?\d*$/.test(text)) {
            setPostData(prev => ({ ...prev, [field]: text }));
        }
    };

    const [unitMenuVisible, setUnitMenuVisible] = useState(false);
    const openUnitMenu = () => setUnitMenuVisible(true);
    const closeUnitMenu = () => setUnitMenuVisible(false);

    const toggleTag = (tag) => {
        setPostData((prev) => {
            const isSelected = prev.tags.includes(tag);
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
        let missingFields = [];

        if (!title) missingFields.push('Title');
        if (!description) missingFields.push('Description');
        if (!image) missingFields.push('Image');
        //if (!location) missingFields.push('Location');

        if (type === 'sell' && !sellingPrice) {
            missingFields.push('Price');
        }

        if (type === 'rent') {
            if (!rentalPrice) missingFields.push('Price');
            if (!rentalPriceUnit) missingFields.push('Price Unit');
            if (!rentalPriceDuration) missingFields.push('Availability');
        }

        if (missingFields.length > 0) {
            showDialog(
                'Missing Information',
                `Please fill out the following fields: ${missingFields.join(', ')}`
            );
        } else {
            try {
                const user = auth.currentUser;
                if (user) {
                    let imageUrl = postData.image;
                    if (postData.image && (postData.image.startsWith('file://') || postData.image.startsWith('data:'))) {
                        const response = await fetch(postData.image);
                        const blob = await response.blob();
                        const storageRef = ref(storage, imagePath);
                        await uploadBytes(storageRef, blob);
                        imageUrl = await getDownloadURL(storageRef);
                    }

                    await addDoc(collection(db, "posts"), {
                        ...postData,
                        image: imageUrl,
                        userId: user.uid,
                        createdAt: serverTimestamp(),
                        postType: type,
                    });
                    showDialog('Success', 'Post submitted successfully!');
                    if (onPostSuccess) {
                        onPostSuccess();
                    }
                } else {
                    showDialog('Error', 'You must be logged in to create a post.');
                }
            } catch (error) {
                console.error("Error adding document: ", error);
                showDialog('Error', 'There was an error submitting your post.');
            }
        }
    };
    
    const [imagePath] = useState(() => `posts/${Date.now()}.jpg`);
  return (
    <View style={styles.container}>
        <Portal>
            <Dialog visible={dialogVisible} onDismiss={hideDialog}>
                <Dialog.Title>{dialogTitle}</Dialog.Title>
                <Dialog.Content>
                    <Text>{dialogMessage}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={hideDialog}>Ok</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
        <Text>Create Post Component</Text> 
        <Text>Post Type: {type}</Text>
        <EditableImage
            imageUri={postData.image}
            setImageUri={(uri) => setPostData((prev) => ({ ...prev, image: uri }))}
            imagePath={imagePath}
            editable={true}
            style={styles.image}
        />
        <TextInput
            mode="outlined"
            label="Title"
            value={postData.title}
            onChangeText={text => setPostData({...postData, title: text})}
            style={styles.input}
        />
        {type === 'sell' &&(
            <TextInput
                mode="outlined"
                label="Price"
                keyboardType="numeric"
                value={postData.sellingPrice}
                onChangeText={text => handleNumericInput(text, 'sellingPrice')}
                style={styles.input}
            />
        )}
        {type == 'donate' && (
            <View>
            <TextInput
                mode="outlined"
                label="Price"
                keyboardType="numeric"
                value={0}
                disabled={true}
                style={styles.input}
            />
            <Text>This item will be listed as FREE.</Text>
            </View>
        )}
        <TextInput
            mode="outlined"
            label="Description"
            value={postData.description}
            onChangeText={text => setPostData({...postData, description: text})}
            style={styles.input}
        />
        <View style={styles.chipContainer}>
            {TAG_OPTIONS.map((tag) => (
                <Chip
                    key={tag}
                    style={styles.chip}
                    selected={postData.tags.includes(tag)}
                    onPress={() => toggleTag(tag)}
                >
                    {tag}
                </Chip>
            ))}
        </View>
        {type === 'rent' && (
            <View style={styles.rentContainer}>
                <View style={styles.priceContainer}>
                    <TextInput
                        mode="outlined"
                        label="Price"
                        keyboardType="numeric"
                        value={postData.rentalPrice}
                        onChangeText={text => handleNumericInput(text, 'rentalPrice')}
                        style={styles.priceInput}
                    />
                    <Menu
                        visible={unitMenuVisible}
                        onDismiss={closeUnitMenu}
                        anchor={
                            <Button mode="outlined" onPress={openUnitMenu} style={styles.unitButton}>
                                {postData.rentalPriceUnit ? `per ${postData.rentalPriceUnit}`: 'Select unit'}
                            </Button>
                        }>
                        <Menu.Item onPress={() => { setPostData({...postData, rentalPriceUnit: 'day'}); closeUnitMenu(); }} title="per day" />
                        <Menu.Item onPress={() => { setPostData({...postData, rentalPriceUnit: 'week'}); closeUnitMenu(); }} title="per week" />
                        <Menu.Item onPress={() => { setPostData({...postData, rentalPriceUnit: 'month'}); closeUnitMenu(); }} title="per month" />
                    </Menu>
                </View>
                <TextInput
                    mode="outlined"
                    label="Deposit (Optional)"
                    keyboardType="numeric"
                    value={postData.rentalPriceDeposit}
                    onChangeText={text => handleNumericInput(text, 'rentalPriceDeposit')}
                    style={styles.input}
                />
                <Text style={styles.label}>Availability (Duration)</Text>
                <View style={styles.chipContainer}>
                    {DURATION_OPTIONS.map((duration) => (
                        <Chip
                            key={duration}
                            style={styles.chip}
                            selected={postData.rentalPriceDuration === duration}
                            onPress={() => setPostData(prev => ({...prev, rentalPriceDuration: duration}))}
                        >
                            {duration}
                        </Chip>
                    ))}
                </View>
            </View>
        )}
        <LocationSearch
            onSelect={(loc) => {
                setPostData((prev) => ({ ...prev, location: loc }));
            }}
            style={styles.input}
        />
        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
            Submit Post
        </Button>
        
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    input: {
        marginBottom: 16,
        width: '90%'
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 16
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '90%',
        marginTop: 12,
        marginBottom: 16,
    },
    chip: {
        margin: 4
    },
    rentContainer: {
        width: '90%'
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceInput: {
        flex: 1,
        marginRight: 8,
    },
    unitButton: {
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#6200ee'
    },
    button: {
        width: '90%',
        padding: 8,
        marginTop: 16,
    }
});

export default CreatePost;