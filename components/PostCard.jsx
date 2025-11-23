import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

const PostCard = ({ post = {} }) => {
  const router = useRouter();
  const {
    image,
    postType,
    rentalPrice,
    rentalPriceUnit,
    sellingPrice,
    title,
  } = post;

  const mappingUnit = {
    'monthly' : 'month',
    'weekly' : 'week',
    'daily' : 'day',
    'yearly' : 'year'
  }

  const PRICE_FONT_SIZE = 12;

  return (
    <View 
      style={{
        width: '48%',
        justifyContent: 'space-between',
      }}
    >
      <Pressable onPress={() => router.push({ pathname: `/postDetail`, params: {id: post.id}})}>
      <View style ={{ marginBottom: 20, padding: 10}}>
      {/* <Card style ={{ marginBottom: 20, padding: 10, borderRadius: 10, backgroundColor: 'rgb(230,230,230,1)'}} elevation={1}> */}
        <Card style={{borderRadius: 8, marginBottom: 6}} elevation={2}>
        <Card.Cover 
          source={{ uri: image }}
          elevation={1}
        />
        </Card>
        <Text
          variant="titleMedium"
          numberOfLines={2}
          style={{
            fontSize: 18,
            color: 'rgba(0,0,0,1)',  
            marginBottom: 6,
          }}
        >
          {title}
        </Text>
        {(postType === 'sell') && sellingPrice ? (
          <View style={{
            backgroundColor: '#2e7d3215',
            borderRadius: 6,
            paddingVertical: 6,
            paddingHorizontal: 6,
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: '#2e7d32'
          }}>
            <Text style={{ color: '#2e7d32', fontWeight: '700', fontSize: PRICE_FONT_SIZE }}>
              ${sellingPrice}
            </Text>
          </View>
        ) : null}

        {postType === 'rent' && rentalPrice ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#0d47a11A',
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 6,
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: '#0d47a1'
          }}>
            <Text style={{ color: '#0d47a1', fontWeight: '700', fontSize: PRICE_FONT_SIZE, marginRight: 4 }}>
              ${rentalPrice}
            </Text>
            <Text style={{ color: '#0d47a1', fontWeight: '600', fontSize: PRICE_FONT_SIZE }}>
              / {mappingUnit[rentalPriceUnit] || rentalPriceUnit}
            </Text>
          </View>
        ) : null}

        {postType === 'donate' ? (
          <View style={{
            backgroundColor: '#6a1b9a20',
            borderRadius: 6,
            paddingVertical: 6,
            paddingHorizontal: 6,
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: '#6a1b9a'
          }}>
            <Text style={{ color: '#6a1b9a', fontWeight: '700', fontSize: PRICE_FONT_SIZE }}>
              FREE
            </Text>
          </View>
        ) : null}
      {/* </Card> */}
      </View>
      </Pressable>
    </View>
  );
};

export default PostCard;

