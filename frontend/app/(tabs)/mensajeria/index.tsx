import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import ChatsCreados from './ChatsCreados';
import UsuariosCiudad from './UsuariosCiudad';

export default function MensajeriaScreen() {
  const [tab, setTab] = useState<'chats' | 'ciudad'>('chats');

   return (
    <ImageBackground
      source={require("../../../assets/images/fondo.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'chats' && styles.tabBtnActive]}
            onPress={() => setTab('chats')}
          >
            <Text style={[styles.tabText, tab === 'chats' && styles.tabTextActive]}>Chats creados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'ciudad' && styles.tabBtnActive]}
            onPress={() => setTab('ciudad')}
          >
            <Text style={[styles.tabText, tab === 'ciudad' && styles.tabTextActive]}>Usuarios en tu ciudad</Text>
          </TouchableOpacity>
        </View>

        {/* Contenido */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {tab === 'chats' ? <ChatsCreados /> : <UsuariosCiudad />}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    borderBottomWidth: 5,
    borderColor: '#76BDF1',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '',
  },
});