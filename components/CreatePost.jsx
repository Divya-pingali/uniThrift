import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import LocationSearch from './LocationSearch';

const CreatePost = () => {
    const [postData, setPostData] = useState({
        title: '',
        description: '',
        location: null,
    });

  return (
    <View style={styles.container}>
        <Text>Create Post Component</Text> 
        <TextInput
            mode="outlined"
            label="Title"
            value={postData.title}
            onChangeText={text => setPostData({...postData, title: text})}
            style={styles.input}
        />
        <TextInput
            mode="outlined"
            label="Description"
            value={postData.description}
            onChangeText={text => setPostData({...postData, description: text})}
            style={styles.input}
        />

        <LocationSearch
            onSelect={(loc) => {
                setPostData((prev) => ({ ...prev, location: loc }));
            }}
            style={styles.input}
        />
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
    }
});

export default CreatePost;