# React Native - Base Expo Router JavaScript

## Pré-requisitos
- Node instalado no PC
- Expo Go instalado no celular (opcional)

## Clonar repositório
```bash
git clone https://github.com/BiaGaio/Tcc
```

## Instalar as dependências do projeto
```bash
npm install
```

## Executar o servidor
```bash
npx expo start
```

## Acessar o servidor

### Pelo PC
Abra o navegador e acesse [http://localhost:8081/](http://localhost:8081/)

### Pelo celular
Abra o aplicativo `Expo Go` e escaneie o QR Code exibido no terminal com o aplicativo.

Caso o app não abra após escanear, escolha a opção de inserir a URL. A URL é `exp://192.168.x.x:8081/`.

Para ver o IP, digite no terminal:
- Windows
    ```cmd
    ipconfig
    ```
    O IP está na linha onde diz `Endereço IPv4`.

    ```cmd
    Endereço IPv4. . . . . . . .  . . . . . . . : 192.168.x.x
    ```

- Linux
    ```bash
    ifconfig
    ```
    O IP está na linha onde diz `inet 192.168.x.x`.

    ```bash
    eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.x.x
    ```

## Funcionalidades do app
- Erros/Bugs/Detalhes
    - [x] Arrumar as datas para o mesmo UTC
    - [x] Arquivo `.env`
    - [ ] Excluir `.env` (do git)
    - [x] Exbir `toast` para as ações realizadas
    - [ ] QR Code funfa
    - [x] Gerar apk - EAS - (problema: era .env n lido, até pq n era enviado)
        - [ ] Configurar variáveis de ambiente no [expo.dev](https://expo.dev/)
    - [ ] Colocar as coleções na outra conta
    - [x] Notificações
    - [x] Recalcular questões resolvidas + porcentagem do progresso geral (na descricao) - tela progresso
    - [x] Streaks - Foguin
    - [x] Criar conteúdos padrão ao criar a conta (Após o cadastro, tem área e matéria)
    - [x] Revisar proteção de usuário
    - [ ] Atualizar carregamento com `ActivityIndicator` (opcional)
    - [x] Componentes no modal (app no celular) não fica com tamanho certo (add ScrollView)
- Autenticação
    - [X] Cadastro de usuários
    - [X] Login
    - [X] Logout
    - [x] Editar dados da conta
    - [ ] Excluir conta
- Dashboard
    - [x] Tela principal
    - [x] Parte do progresso
    - [x] Parte das atividades
    - [x] Mostrar dados das áreas
    - [x] Mostrar próximas atividades
- Materias e Contéudos
    - [x] Tela principal
    - [x] Alguns conteúdos cadastrados no banco
    - [x] Listar
    - [x] Calculando estatísticas
    - [x] Modal com estatísticas
    - [x] Modal para criar conteúdos
    - [x] Criar conteúdos
    - [x] Atualizar conteúdos
    - [x] Excluir conteúdos
    - [x] Algumas cadastrados no banco
    - [x] Listar matérias
    - [x] Criar matérias
    - [x] Atualizar matéria
    - [x] Excluir matéria
- Cronograma
    - [x] Tela principal
    - [x] Modal para criar atividade
    - [x] Adicionar atividade
    - [x] Listar atividade
    - [x] Atualizar atividade
    - [x] Excluir atividade
- Progresso
    - [x] Tela principal
    - [x] Listar matérias
    - [x] Filtrar por matérias
    - [x] Exibir quantidade de matérias selecionadas
    - [x] Exibir quantidade de questões resolvidas
    - [x] Modal de dados de uma matéria
    - [x] Modal gerenciar matérias
- Armazenamento de Sessoes
    - [x] Tela principal
    - [x] Criar contador normal
    - [x] Criar contador pomodoro
    - [x] Salvar sessão
- Gamificação
    - [x] Mostrar as streaks na home
    - [x] Animação de um foguinho (gif)
    - [x] Foguinho "apagado" (indicando que hoje não estudou)
    - [x] Registrar no banco a sequência estudada (criar mais uma tabela)
- Configuração
    - [x] Layout - Tela
    - [x] Mudar senha
    - [x] Logout

## Gerar APK
- Instalar `eas-cli`:
    ```
    npm install -g eas-cli
    ```

- Fazer o login no [expo.dev](https://expo.dev/):
    ```
    eas login
    ```
    > Informe seu nome de usuário e senha utilizada!

- Defina as configurações do projeto para android:
    ```
    eas build:configure
    ```
    > Selecione 'Android'. Isso irá gerar um arquivo `eas.json` com as configurações do APK.

- Crie o APK:
    ```
    eas build -p android --profile preview
    ```
    > O processo de  build leva em torno de 10 minutos para ser finalizado.

    Após isso, vá para a página do projeto no navegador, onde estará disponível o APK.

## Baixar APK

Escaneie o QR Code abaixo para baixar o app:

![QR Code para download](https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://raw.githubusercontent.com/hick-hpe/react-native-base-expo-router-javascript/main/apk-e-qrcode-gerado/app-sos-v14.apk)

Ou clique aqui para baixar:  
[Baixar APK](https://raw.githubusercontent.com/hick-hpe/react-native-base-expo-router-javascript/main/apk-e-qrcode-gerado/app-sos-v14.apk)

