import { useState } from 'react';
import { Stylesheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

const CreatePost = () => {
    const [postData, setPostData] = useState({
        title: '',
        description: ''
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
    </View>
  );
}

const styles = Stylesheet.create({
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