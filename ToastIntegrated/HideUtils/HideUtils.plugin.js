//META{"name":"HideUtils","displayName":"HideUtils","website":"https://github.com/Arashiryuu","source":"https://github.com/Arashiryuu/crap/blob/master/ToastIntegrated/HideUtils/HideUtils.plugin.js"}*//

/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject('WScript.Shell');
	var fs = new ActiveXObject('Scripting.FileSystemObject');
	var pathPlugins = shell.ExpandEnvironmentStrings('%APPDATA%\\BetterDiscord\\plugins');
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup('It looks like you\'ve mistakenly tried to run me directly. \n(Don\'t do that!)', 0, 'I\'m a plugin for BetterDiscord', 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup('I\'m in the correct folder already.\nJust reload Discord with Ctrl+R.', 0, 'I\'m already installed', 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup('I can\'t find the BetterDiscord plugins folder.\nAre you sure it\'s even installed?', 0, 'Can\'t install myself', 0x10);
	} else if (shell.Popup('Should I copy myself to BetterDiscord\'s plugins folder for you?', 0, 'Do you need some help?', 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec('explorer ' + pathPlugins);
		shell.Popup('I\'m installed!\nJust reload Discord with Ctrl+R.', 0, 'Successfully installed', 0x40);
	}
	WScript.Quit();

@else@*/

var HideUtils = (() => {

	/* Setup */

	const config = {
		main: 'index.js',
		info: {
			name: 'HideUtils',
			authors: [
				{
					name: 'Arashiryuu',
					discord_id: '238108500109033472',
					github_username: 'Arashiryuu',
					twitter_username: ''
				}
			],
			version: '2.1.11',
			description: 'Allows you to hide users, servers, and channels individually.',
			github: 'https://github.com/Arashiryuu',
			github_raw: 'https://raw.githubusercontent.com/Arashiryuu/crap/master/ToastIntegrated/HideUtils/HideUtils.plugin.js'
		},
		changelog: [
			{
				title: 'Bugs Squashed!',
				type: 'fixed',
				items: ['No longer crashes the app!', 'Works again!']
			}
		]
	};

	/* Utility */

	const log = function() {
		/**
		 * @type {Array}
		 */
		const args = Array.prototype.slice.call(arguments);
		args.unshift(`%c[${config.info.name}]`, 'color: #3A71C1; font-weight: 700;');
		return console.log.apply(this, args);
	};

	const err = function() {
		/**
		 * @type {Array}
		 */
		const args = Array.prototype.slice.call(arguments);
		args.unshift(`%c[${config.info.name}]`, 'color: #3A71C1; font-weight: 700;');
		return console.error.apply(this, args);
	};

	/* Build */

	const buildPlugin = ([Plugin, Api]) => {
		const { Toasts, Patcher, Settings, Utilities, DOMTools, ReactTools, ReactComponents, DiscordModules, DiscordClasses, WebpackModules, DiscordSelectors, PluginUtilities } = Api;
		const { SettingPanel, SettingField, SettingGroup, Switch } = Settings;
		const { ComponentDispatch: Dispatcher } = WebpackModules.getByProps('ComponentDispatch');
		const { React, ReactDOM, ModalStack, ContextMenuActions: MenuActions } = DiscordModules;

		const TextElement = WebpackModules.getByProps('Sizes', 'Weights');
		const TooltipWrapper = WebpackModules.getByPrototypes('renderTooltip');
		
		const has = Object.prototype.hasOwnProperty;
		const MessageClasses = WebpackModules.getByProps('containerCozy', 'dividerEnabled');
		const MenuItem = WebpackModules.getByString('disabled', 'brand');
		const ToggleMenuItem = WebpackModules.getByString('disabled', 'itemToggle');
		const guilds = WebpackModules.getByProps('wrapper', 'unreadMentionsIndicatorTop');
		const buttons = WebpackModules.getByProps('button');
		const positionedContainer = WebpackModules.getByProps('positionedContainer');
		const messagesWrapper = WebpackModules.getByProps('messages', 'messagesWrapper');
		const wrapper = WebpackModules.getByProps('messagesPopoutWrap');
		const scroller = WebpackModules.getByProps('scrollerWrap');
		const dividerContent = WebpackModules.getByProps('divider', 'dividerRed', 'dividerContent');

		const Button = class Button extends React.Component {
			constructor(props) {
				super(props);
				this.onClick = this.onClick.bind(this);
			}

			onClick(e) {
				if (this.props.action) this.props.action(e);
			}

			render() {
				const style = this.props.style || {};
				return React.createElement('button', {
					id: 'HideUtils-Button',
					className: this.props.className || 'button',
					style,
					onClick: this.onClick,
				}, this.props.text);
			}
		};

		const ItemGroup = class ItemGroup extends React.Component {
			constructor(props) {
				super(props);
			}

			render() {
				return React.createElement('div', {
					className: DiscordClasses.ContextMenu.itemGroup.toString(),
					children: this.props.children || []
				});
			}
		};

		const CloseButton = class CloseButton extends React.Component {
			constructor(props) {
				super(props);
				this.onClick = this.onClick.bind(this);
			}

			onClick() {
				if (this.props.onClick) this.props.onClick();
			}

			render() {
				return React.createElement('svg', {
					id: 'HideUtils-CloseButton',
					className: 'close-button',
					width: 16,
					height: 16,
					viewBox: '0 0 24 24',
					onClick: this.onClick
				},
					React.createElement('path', { d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' }),
					React.createElement('path', { d: 'M0 0h24v24H0z', fill: 'none' })
				);
			}
		};

		const Modal = class Modal extends React.Component {
			constructor(props) {
				super(props);
				this._labels = {
					'Channels': 'ID: {{id}}\nGuild: {{guild}}\nChannel: {{channel}}',
					'Servers': 'ID: {{id}}\nGuild: {{guild}}',
					'Users': 'ID: {{id}}\nTag: {{tag}}'
				};
				this.close = this.close.bind(this);
				this.replaceLabels = this.replaceLabels.bind(this);
			}

			close() {
				ModalStack.popWithKey('HideUtils-SettingsModal');
			}

			replaceLabels(label, data) {
				if (!has.call(this._labels, label)) return null;

				const string = this._labels[label];

				if (label === 'Channels') return string
					.replace(/{{id}}/, data.id)
					.replace(/{{guild}}/, data.guild)
					.replace(/{{channel}}/, data.name);

				if (label === 'Servers') return string
					.replace(/{{id}}/, data.id)
					.replace(/{{guild}}/, data.name);

				return string
					.replace(/{{id}}/, data.id)
					.replace(/{{tag}}/, data.tag);
			}

			render() {
				const label = this.props.name;
				const data = [];

				if (this.props.data) {
					for (const entry of Object.values(this.props.data)) {
						if (Array.isArray(entry)) continue;

						const item = React.createElement(TooltipWrapper, {
							text: this.replaceLabels(label, entry),
							color: TooltipWrapper.Colors.BLACK,
							position: TooltipWrapper.Positions.TOP,
							children: (props) => {
								const type = label.slice(0, -1);
								const hasImage = type === 'User' || type === 'Server';
								const style = {};

								if (hasImage) Object.assign(style, { backgroundImage: `url(${entry.icon})`, backgroundSize: 'cover', backgroundPosition: 'center' });

								return React.createElement('div', Object.assign({
									id: 'HideUtils-Tooltip',
									className: 'buttonWrapper'
								}, props),
									React.createElement(Button, {
										text: entry.name ? entry.name : entry.tag,
										className: `${type.toLowerCase()}-button`,
										style,
										action: () => {
											Dispatcher.dispatch(`HIDEUTILS_BUTTON_${type.toUpperCase()}CLEAR`, entry.id);
											this.forceUpdate();
										}
									})
								);
							}
						});

						data.push(item);
					}

					const count = TextElement.default({
						weight: TextElement.Weights.BOLD,
						color: TextElement.Colors.BRAND,
						size: TextElement.Sizes.MEDIUM,
						style: {
							textTransform: 'uppercase',
							borderBottom: '2px solid currentColor',
							marginBottom: '4px'
						},
						children: [label, ' hidden \u2014 ', data.length]
					});

					data.unshift(count, React.createElement('hr', { style: { border: 'none' } }));
				} else {
					data.push(
						React.createElement('div', {
							id: 'HideUtils-Instructions',
							className: 'instructions'
						},	
							TextElement.default({
								color: TextElement.Colors.PRIMARY,
								children: [
									TextElement.default({
										weight: TextElement.Weights.BOLD,
										color: TextElement.Colors.BRAND,
										size: TextElement.Sizes.MEDIUM,
										style: {
											textTransform: 'uppercase',
											borderBottom: '2px solid currentColor',
											marginBottom: '4px'
										},
										children: ['How to']
									}),
									'\u2022 Right-click on a channel, server, or user.',
									React.createElement('br', {}),
									'\u2022\u2022 Left-click the hide option in the context-menu.',
									React.createElement('hr', { style: { border: 'none' } }),
									TextElement.default({
										weight: TextElement.Weights.BOLD,
										color: TextElement.Colors.BRAND,
										size: TextElement.Sizes.MEDIUM,
										style: {
											textTransform: 'uppercase',
											borderBottom: '2px solid currentColor',
											marginBottom: '4px'
										},
										children: ['Note']
									}),
									'\u2022 Unhiding requires use of the settings-panel, and is not handled within a context-menu.',
									React.createElement('br', {}),
									'\u2022\u2022 Click on a hidden element in its respective settings modal to unhide it.'
								]
							})
						)
					);
				}

				return React.createElement('div', {
					className: `${wrapper.messagesPopoutWrap} ${DiscordClasses.Popouts.themedPopout}`
				},
					React.createElement('div', {
						className: `${wrapper.header} ${DiscordClasses.Popouts.header}`
					},
						React.createElement(CloseButton, {
							onClick: this.close
						}),
						TextElement.default({
							className: wrapper.title,
							color: TextElement.Colors.PRIMARY,
							children: ['HideUtils \u2014 ', label]
						})
					),
					React.createElement('div', {
						className: scroller.scrollerWrap
					},
						React.createElement('div', {
							className: `${scroller.scroller} ${scroller.systemPad} ${wrapper.messagesPopout}`,
							scrollable: true,
							children: data
						})
					)
				);
			}
		};

		const Select = class Select extends React.Component {
			constructor(props) {
				super(props);
				this.openInstructions = this.openInstructions.bind(this);
				this.openChannels = this.openChannels.bind(this);
				this.openServers = this.openServers.bind(this);
				this.openUsers = this.openUsers.bind(this);
			}

			openChannels() {
				ModalStack.push(Modal, { name: 'Channels', data: this.props.channels }, 'HideUtils-SettingsModal');
			}

			openServers() {
				ModalStack.push(Modal, { name: 'Servers', data: this.props.servers }, 'HideUtils-SettingsModal');
			}

			openUsers() {
				ModalStack.push(Modal, { name: 'Users', data: this.props.users }, 'HideUtils-SettingsModal');
			}

			openInstructions() {
				ModalStack.push(Modal, { name: 'Instructions', data: null }, 'HideUtils-SettingsModal');
			}

			render() {
				return React.createElement('div', {
					id: 'HideUtils-Settings',
					className: 'HUSettings'
				},
					React.createElement('div', {
						id: 'Setting-Select',
						className: 'container'
					},
						React.createElement('h3', {
							className: 'settingsHeader'
						},
							React.createElement('div', {
								id: 'HideUtils-ButtonGroup',
								className: 'buttonGroup'
							},
								React.createElement(Button, {
									text: 'Channels',
									action: this.openChannels
								}),
								React.createElement(Button, {
									text: 'Servers',
									action: this.openServers
								}),
								React.createElement(Button, {
									text: 'Users',
									action: this.openUsers
								}),
								React.createElement(Button, {
									text: 'Instructions',
									action: this.openInstructions
								})
							)
						)
					)
				);
			}
		};

		const SelectionField = class SelectionField extends SettingField {
			constructor(name, note, data, onChange) {
				super(name, note, onChange, Select, {
					users: data.users,
					servers: data.servers,
					channels: data.channels
				});
			}
		};
		
		return class HideUtils extends Plugin {
			constructor() {
				super();
				this._css;
				this.promises = {
					state: { cancelled: false },
					cancel() { this.state.cancelled = true; },
					restore() { this.state.cancelled = false; }
				};
				this.default = {
					channels: {},
					servers: { unhidden: [] },
					users: {},
					hideBlocked: true
				};
				this.settings = Utilities.deepclone(this.default);
				this.css = `
					.theme-light #HideUtils-CloseButton {
						fill: #72767d;
					}
					#HideUtils-CloseButton {
						fill: white;
						cursor: pointer;
						opacity: 0.6;
						float: right;
						transition: opacity 200ms ease;
					}
					#HideUtils-CloseButton:hover {
						opacity: 1;
					}
					#HideUtils-Settings {
						overflow-x: hidden;
					}
					#HideUtils-Settings h3 {
						text-align: center;
						color: #CCC;
					}
					#HideUtils-Settings #HideUtils-ButtonGroup .button {
						background: #7289DA;
						color: #FFF;
						border-radius: 5px;
						margin: 5px;
						height: 30px;
						width: auto;
						min-width: 6vw;
						padding: 0 1vw;
					}
					#HideUtils-Settings button,
					#HideUtils-Button {
						background: #7289DA;
						color: #FFF;
						width: 5vw;
						height: 30px;
						border-radius: 5px;
						padding: 0;
						font-size: 14px;
					}
					#HideUtils-Tooltip {
						display: inline-block;
						margin: 5px;
						overflow-y: auto;
					}
					#HideUtils-Tooltip button {
						/*overflow: hidden;
						width: 5vw;
						height: 30px;
						word-break: break-word;
						white-space: nowrap;
						text-overflow: ellipsis;*/
						min-height: 5vh;
						min-width: 5vw;
						height: 5vh;
						width: auto;
						max-height: 10vh;
						max-width: 10vw;
						font-size: 10pt;
						word-break: break-word;
						word-wrap: break-word;
						text-overflow: ellipsis;
						padding: 0 5px;
						display: flex;
						justify-content: center;
						overflow: hidden;
					}
					#HideUtils-Settings .icons .container::-webkit-scrollbar {
						width: 7px !important;
						background: rgba(0, 0, 0, 0.4);
					}
					#HideUtils-Settings .icons .container::-webkit-scrollbar-thumb {
						min-height: 20pt !important;
						min-width: 20pt !important;
						background: rgba(255, 255, 255, 0.6) !important;
					}
				`;
				
				this.userClear = this.userClear.bind(this);
				this.servClear = this.servClear.bind(this);
				this.chanClear = this.chanClear.bind(this);
				this.idRegex = /^\d{16,18}$/;
				this.channel;
				this.guild;
				this.user;
				this.mute;
			}

			/* Methods */

			setup() {
				this.channel = DiscordModules.ChannelStore.getChannel;
				this.guild = DiscordModules.GuildStore.getGuild;
				this.user = DiscordModules.UserStore.getUser;
				this.mute = WebpackModules.getByProps('setLocalVolume').setLocalVolume;
			}

			subscribe() {
				Dispatcher.subscribe('HIDEUTILS_BUTTON_USERCLEAR', this.userClear);
				Dispatcher.subscribe('HIDEUTILS_BUTTON_SERVERCLEAR', this.servClear);
				Dispatcher.subscribe('HIDEUTILS_BUTTON_CHANNELCLEAR', this.chanClear);
			}

			unsubscribe() {
				Dispatcher.unsubscribe('HIDEUTILS_BUTTON_USERCLEAR', this.userClear);
				Dispatcher.unsubscribe('HIDEUTILS_BUTTON_SERVERCLEAR', this.servClear);
				Dispatcher.unsubscribe('HIDEUTILS_BUTTON_CHANNELCLEAR', this.chanClear);
			}

			onStart() {
				this.promises.restore();
				PluginUtilities.addStyle(this.short, this.css);
				this.setup();
				this.loadSettings(this.settings);
				this.subscribe();
				this.patchAll(this.promises.state);
				Toasts.info(`${this.name} ${this.version} has started!`, { timeout: 2e3 });
			}

			onStop() {
				this.promises.cancel();
				PluginUtilities.removeStyle(this.short);
				this.unsubscribe();
				Patcher.unpatchAll();
				this.updateAll();
				Toasts.info(`${this.name} ${this.version} has stopped!`, { timeout: 2e3 });
			}

			patchAll(promiseState) {
				this.patchGuilds(promiseState);
				this.patchChannels(promiseState);
				this.patchMessages(promiseState);
				this.patchMemberList(promiseState);
				this.patchTypingUsers(promiseState);
				this.patchContextMenu(promiseState);
				this.patchIsMentioned(promiseState);
				this.patchReceiveMessages(promiseState);
			}

			updateAll() {
				this.updateGuilds();
				this.updateChannels();
				this.updateMessages();
				this.updateMemberList();
				this.updateContextMenu();
			}

			patchReceiveMessages() {
				Patcher.instead(DiscordModules.MessageActions, 'receiveMessage', (that, args, value) => {
					const [channelId, { author }] = args;
					if (has.call(this.settings.users, author.id) || DiscordModules.RelationshipStore.isBlocked(author.id)) return;
					return value.apply(that, args);
				});
			}

			patchIsMentioned() {
				const Module = WebpackModules.getByProps('isMentioned');
				Patcher.instead(Module, 'isMentioned', (that, args, value) => {
					const [{ author }] = args;
					if (has.call(this.settings.users, author.id)) return false;
					return value.apply(that, args);
				});
			}

			async patchTypingUsers(promiseState) {
				const { component: TypingUsers } = await ReactComponents.getComponentByName('TypingUsers', DiscordSelectors.Typing.typing.toString()); // WebpackModules.getByDisplayName('FluxContainer(TypingUsers)');
				if (promiseState.cancelled) return;
				Patcher.before(TypingUsers.prototype, 'render', ({ props: { typingUsers } }) => {
					for (const id in typingUsers) has.call(this.settings.users, id) && delete typingUsers[id];
				}, { displayName: 'TypingUsers' });
			}

			async patchChannelContextMenu(promiseState) {
				const { component: ChannelContextMenu } = await ReactComponents.getComponentByName('ChannelContextMenu', DiscordSelectors.ContextMenu.contextMenu.toString());
				if (promiseState.cancelled) return;
				Patcher.after(ChannelContextMenu.prototype, 'render', (that, args, value) => {
					if (!that.props.type.startsWith('CHANNEL_LIST_')) return value;
					const channel = this.getProps(that, 'props.channel');

					const orig = this.getProps(value, 'props');
					let itemToRender;

					if (this.settings.servers.unhidden.includes(channel.guild_id)) {
						itemToRender = new MenuItem({
							label: 'Unhide Channel',
							action: () => {
								MenuActions.closeContextMenu();
								this.chanClear(channel.id);
							}
						});
					} else {
						itemToRender = new MenuItem({
							label: 'Hide Channel',
							action: () => {
								MenuActions.closeContextMenu();
								this.chanPush(channel.id);
							}
						});
					}

					const group = React.createElement(ItemGroup, { children: [itemToRender] });

					if (Array.isArray(orig.children)) orig.children.unshift(group);
					else orig.children = [group, orig.children];

					setImmediate(() => this.updateContextPosition(that));

					return value;
				});
				this.updateContextMenu();
			}

			async patchGuildContextMenu(promiseState) {
				const { component: GuildContextMenu } = await ReactComponents.getComponentByName('GuildContextMenu', DiscordSelectors.ContextMenu.contextMenu.toString());
				if (promiseState.cancelled) return;
				Patcher.after(GuildContextMenu.prototype, 'render', (that, args, value) => {
					const orig = this.getProps(value, 'props');
					const id = this.getProps(that, 'props.guild.id');
					const active = this.settings.servers.unhidden.includes(id);

					if (!orig || !id) return;

					const hideItem = new MenuItem({
						label: 'Hide Server',
						action: () => {
							MenuActions.closeContextMenu();
							this.servPush(id);
							this.clearUnhiddenChannels(id);
						}
					});

					const unhideItem = new ToggleMenuItem({
						label: 'Unhide Channels',
						active: active,
						action: () => {
							this.servUnhideChannels(id);
						}
					});

					const clearItem = new MenuItem({
						label: 'Purge Hidden Channels',
						action: () => {
							MenuActions.closeContextMenu();
							this.chanPurge(id);
						}
					});

					const group = React.createElement(ItemGroup, { children: [hideItem, unhideItem, clearItem] });

					if (Array.isArray(orig.children)) orig.children.unshift(group);
					else orig.children = [group, orig.children];

					setImmediate(() => this.updateContextPosition(that));

					return value;
				});
				this.updateContextMenu();
			}

			async patchUserContextMenu(promiseState) {
				const { component: UserContextMenu } = await ReactComponents.getComponentByName('UserContextMenu', DiscordSelectors.ContextMenu.contextMenu.toString());
				if (promiseState.cancelled) return;
				Patcher.after(UserContextMenu.prototype, 'render', (that, args, value) => {
					if (!DiscordModules.GuildStore.getGuild(DiscordModules.SelectedGuildStore.getGuildId())) return value;
					const orig = this.getProps(value, 'props.children.props.children.props');
					if (!orig) return;
					
					const item = new MenuItem({
						label: 'Hide User',
						action: () => {
							MenuActions.closeContextMenu();
							const user = this.getProps(that, 'props.user');
							this.userPush(user.id);
						}
					});

					const group = React.createElement(ItemGroup, { children: [item] });

					if (Array.isArray(orig.children)) orig.children.unshift(group);
					else orig.children = [group, orig.children];

					setImmediate(() => this.updateContextPosition(that));

					return value;
				});
				this.updateContextMenu();
			}

			async patchContextMenu(promiseState) {
				if (promiseState.cancelled) return;
				this.patchUserContextMenu(promiseState);
				this.patchGuildContextMenu(promiseState);
				this.patchChannelContextMenu(promiseState);
			}

			updateContextMenu() {
				const menus = document.querySelectorAll(DiscordSelectors.ContextMenu.contextMenu.toString());
				for (let i = 0, len = menus.length; i < len; i++) ReactTools.getOwnerInstance(menus[i]).forceUpdate();
			}

			updateContextPosition(m) {
				if (!m) return;

				let height = this.getProps(m, 'props.onHeightUpdate');
				if (!height) height = this.getProps(m, '_reactInternalFiber.return.memoizedProps.onHeightUpdate');

				height && height();
			}

			/**
			 * @name patchMessageComponent
			 * @author Zerebos
			 */
			async patchMessages(promiseState) {
				const { component: Message } = await ReactComponents.getComponentByName('Messages', `.${messagesWrapper.messagesWrapper.replace(/\s/, '.')}`);
				if (promiseState.cancelled) return;
				Patcher.after(Message.prototype, 'render', (that, args, value) => {
					const props = this.getProps(value, 'props.children.1.props');
					const messageGroups = this.getProps(props, 'children');
					if (!messageGroups || !Array.isArray(messageGroups)) return value;

					props.children = messageGroups.filter((group) => {
						const author = this.getProps(group, 'props.children.props.messages.0.author');
						const blocked = (group.type.displayName === 'BlockedMessageGroups') && this.settings.hideBlocked;
						return !blocked && author && !has.call(this.settings.users, author.id) || !blocked && !author;
					});

					for (const group of props.children) {
						const n = this.getProps(group, 'props.children');
						if (!n || typeof n === 'string') continue;
						n.ref = (e) => {
							const node = ReactDOM.findDOMNode(e);
							if (!node) return;
							setImmediate(() => {
								if (node.nextElementSibling && node.nextElementSibling.className && node.nextElementSibling.className.includes(dividerContent.divider)) return;
								const divider = node.querySelector(`.${MessageClasses.divider}`);
								if (!divider) return;
								if (divider.className === MessageClasses.divider && this.settings.hideBlocked) divider.setAttribute('class', MessageClasses.dividerEnabled);
								else if (divider.className === MessageClasses.dividerEnabled && !this.settings.hideBlocked && node.nextElementSibling && node.nextElementSibling.className.includes(dividerContent.messageGroupBlocked)) divider.setAttribute('class', MessageClasses.divider);
							});
						};
					}

					return value;
				});
				this.updateMessages();
			}

			/**
			 * @name forceUpdateMessages
			 * @author Zerebos
			 */
			updateMessages() {
				const messages = document.querySelector(`.${messagesWrapper.messagesWrapper.replace(/\s/, '.')}`);
				if (messages) ReactTools.getOwnerInstance(messages).forceUpdate();
			}

			async patchGuilds(promiseState) {
				const Guilds = await new Promise((resolve) => {
					const guildsWrapper = document.querySelector(`.${guilds.wrapper.replace(/\s/, '.')}`);
					if (guildsWrapper) return resolve(ReactTools.getOwnerInstance(guildsWrapper).constructor);
				});
				if (promiseState.cancelled) return;
				Patcher.after(Guilds.prototype, 'render', (that, args, value) => {
					const props = this.getProps(that, 'props');
					if (!props.guildFolders || !Array.isArray(props.guildFolders)) return value;

					const children = this.getProps(value, 'props.children.1.props.children');
					if (!children || !Array.isArray(children)) return value;

					const guildIndex = children.findIndex((item) => Array.isArray(item));
					const guilds = this.getProps(children, guildIndex.toString());
					if (!guilds || !Array.isArray(guilds)) return value;

					children[guildIndex] = guilds.filter((guild) => {
						if (Array.isArray(guild.props.guildIds)) {
							guild.props.guildIds = guild.props.guildIds.filter((id) => !has.call(this.settings.servers, id));
							if (!guild.props.guildIds.length) return false;
							return true;
						}
						return !guild || !guild.key || !has.call(this.settings.servers, guild.key);
					});

					return value;
				});

				this.updateGuilds();
			}

			updateGuilds() {
				const guildWrapper = document.querySelector(`.${guilds.wrapper.replace(/\s/, '.')}`);
				if (guildWrapper) ReactTools.getOwnerInstance(guildWrapper).forceUpdate();
			}

			patchMemberList() {
				const Scroller = WebpackModules.getByDisplayName('VerticalScroller');

				Patcher.after(Scroller.prototype, 'render', (that, args, value) => {
					const key = this.getProps(value, 'props.children.0._owner.return.key');
					if (!key || key === 'guild-channels') return value;

					const children = this.getProps(value, 'props.children.0.props.children.1');
					if (!children || !Array.isArray(children)) return value;

					const memberlist = this.getProps(children, '2') || this.getProps(children, '1');
					if (!memberlist || !Array.isArray(memberlist)) return value;

					for (let i = 0, len = children.length; i < len; i++) {
						if (!Array.isArray(children[i])) continue;
						if (children[i].some((child) => child && child.type === 'header')) break;
						for (let j = 0, ren = children[i].length; j < ren; j++) {
							if (children[i][j] && Array.isArray(children[i][j])) {
								children[i][j] = children[i][j].filter((child) => !child || !child.key || (child.key && !has.call(this.settings.users, child.key)));
								if (children[i][j].length === 2 && children[i][j][1] === null && children[i][j][0].props && children[i][j][0].props.type && children[i][j][0].props.type === 'GROUP') {
									children[i][j][0] = null;
								}
							}
						}
					}

					return value;
				});

				this.updateMemberList();
			}

			updateMemberList() {
				const memberList = document.querySelector(DiscordSelectors.MemberList.members.value.trim());
				if (memberList) ReactTools.getOwnerInstance(memberList).handleOnScroll();
			}

			patchChannels() {
				const Scroller = WebpackModules.getByDisplayName('VerticalScroller');
				
				Patcher.after(Scroller.prototype, 'render', (that, args, value) => {
					const key = this.getProps(value, 'props.children.0._owner.return.key');
					if (!key || key !== 'guild-channels') return value;

					const children = this.getProps(value, 'props.children.0.props.children.1.2');
					if (!children || !Array.isArray(children)) return value;

					const guildId = this.getProps(children, '0.0.props.channel.guild_id');
					if (this.settings.servers.unhidden.includes(guildId)) return value;

					for (let i = 0, len = children.length; i < len; i++) {
						if (!children[i] || !Array.isArray(children[i])) continue;
						// If the category naturally has no children, do not unrender
						if (children[i].length === 3 && children[i][0].type.displayName && children[i][0].type.displayName.includes('Category') && children[i][0].props.isEmpty) continue;
						children[i] = children[i].filter((channel) => {
							if (!channel) return channel;
							const props = this.getProps(channel, 'props');
							if (!props.voiceStates || !Array.isArray(props.voiceStates)) return !channel.key || (channel.key && !has.call(this.settings.channels, channel.key));
							props.voiceStates = props.voiceStates.filter((user) => {
								const { voiceState: { userId } } = user;
								if (!has.call(this.settings.users, userId)) return true;
								this.mute(userId, 0);
								return false;
							});
							return true;
						});
						// If we hide all children of a category, unrender it
						if (children[i].length === 1 && children[i][0].type.displayName && children[i][0].type.displayName.includes('Category')) {
							children[i][0] = null;
						}
					}

					return value;
				});

				this.updateChannels();
			}

			updateChannels() {
				const channels = document.querySelector(`.${positionedContainer.positionedContainer.replace(/\s/, '.')}`);
				if (channels) ReactTools.getOwnerInstance(channels).forceUpdate();
			}

			userPush(id) {
				if (!id) return;
				const user = this.user(id);
				if (!user) return Toasts.error('Unable to find user to hide.', { timeout: 3e3 });
				if (has.call(this.settings.users, user.id)) return Toasts.info('This user is already being hidden.', { timeout: 3e3 });
				if (id === DiscordModules.UserInfoStore.getId()) return Toasts.info('You cannot hide yourself.', { timeout: 3e3 });
				this.settings.users[user.id] = {
					id: user.id,
					tag: user.tag,
					icon: user.getAvatarURL()
				};
				Toasts.info('User is now being hidden!', { timeout: 3e3 });
				this.saveSettings(this.settings);
				this.updateAll();
			}

			userClear(id) {
				if (!id) return;
				if (!has.call(this.settings.users, id)) return Toasts.info('This user is not being hidden.', { timeout: 3e3 });
				try { this.mute(id, 100); } catch(e) { err(e); }
				delete this.settings.users[id];
				Toasts.info('User has been unhidden.', { timeout: 3e3 });
				this.saveSettings(this.settings);
				return this.updateAll();
			}

			clearUnhiddenChannels(id) {
				if (!id || !this.settings.servers.unhidden.includes(id)) return false;
				this.settings.servers.unhidden.splice(this.settings.servers.unhidden.indexOf(id), 1);
				return true;
			}

			pushToUnhiddenChannels(id) {
				if (!id || this.settings.servers.unhidden.includes(id)) return false;
				this.settings.servers.unhidden.push(id);
				return true;
			}

			servUnhideChannels(id) {
				if (!id) return;
				if (!this.clearUnhiddenChannels(id) && !this.pushToUnhiddenChannels(id)) return;

				this.saveSettings(this.settings);
				this.updateAll();
			}

			servPush(id) {
				if (!id) return;
				if (has.call(this.settings.servers, id)) return Toasts.info('That server is already being hidden.', { timeout: 3e3 });
				const guild = this.guild(id);
				if (!guild) return Toasts.info('Unable to find server to hide.');
				this.settings.servers[id] = {
					id: guild.id,
					name: guild.name,
					icon: guild.getIconURL()
				};
				Toasts.info('Server has successfully been hidden.', { timeout: 3e3 });
				this.saveSettings(this.settings);
				this.updateAll();
			}

			servClear(id) {
				if (!id) return;
				if (!has.call(this.settings.servers, id)) return Toasts.info('That server is not currently being hidden.', { timeout: 3e3 });
				delete this.settings.servers[id];
				Toasts.info('Server successfully removed!', { timeout: 3e3 });
				this.saveSettings(this.settings);
				this.updateAll();
			}

			chanPush(id) {
				if (!id) return;
				if (has.call(this.settings.channels, id)) return Toasts.info('This channel is already being hidden.', { timeout: 3e3 });
				const channel = this.channel(id);
				if (!channel) return Toasts.info('Unable to find channel to hide.', { timeout: 3e3 });
				const guild = this.guild(channel.guild_id);
				this.settings.channels[id] = {
					id: channel.id,
					name: channel.name,
					guild: guild.name
				};
				Toasts.info('Channel has successfully been hidden.', { timeout: 3e3 });
				this.saveSettings(this.settings);
				this.updateAll();
			}

			chanPurge(guildId) {
				const guild = this.guild(guildId);
				const channels = Object.values(this.settings.channels).filter((chan) => {
					const c = this.channel(chan.id);
					if (!c) return false;
					return c.guild_id === guildId;
				});
				for (const channel of channels) delete this.settings.channels[channel.id];
				Toasts.info(`Channel purge for ${guild.name.trim()} was successful.`, { timeout: 3e3 });
				this.saveSettings(this.settings);
				this.updateAll();
			}

			chanClear(id) {
				if (!id) return;
				if (!has.call(this.settings.channels, id)) return Toasts.info('This channel is not currently being hidden.', { timeout: 3e3 });
				delete this.settings.channels[id];
				Toasts.info('Channel successfully removed.', { timeout: 3e3 });
				this.saveSettings(this.settings);
				this.updateAll();
			}

			/**
			 * @name safelyGetNestedProps
			 * @author Zerebos
			 */
			getProps(obj, path) {
				return path.split(/\s?\.\s?/).reduce((object, prop) => object && object[prop], obj);
			}

			/* Settings Panel */

			getSettingsPanel() {
				return SettingPanel.build(() => this.saveSettings(this.settings),
					new SettingGroup('Plugin Settings').append(
						new SelectionField('HideUtils Setting Select', 'Select which settings you would like to visit.', this.settings, () => {}),
						new Switch('Hide Blocked User Messages', 'Whether or not to unrender messages from blocked users.', this.settings.hideBlocked, (i) => {
							this.settings.hideBlocked = i;
							this.updateAll();
						})
					)
				);
			}

			/* Setters */

			set css(style = '') {
				return this._css = style.split(/\s+/g).join(' ').trim();
			}

			/* Getters */

			get [Symbol.toStringTag]() {
				return 'Plugin';
			}

			get css() {
				return this._css;
			}

			get name() {
				return config.info.name;
			}

			get short() {
				let string = '';

				for (let i = 0, len = config.info.name.length; i < len; i++) {
					const char = config.info.name[i];
					if (char === char.toUpperCase()) string += char;
				}

				return string;
			}

			get author() {
				return config.info.authors.map((author) => author.name).join(', ');
			}

			get version() {
				return config.info.version;
			}

			get description() {
				return config.info.description;
			}
		};
	};

	/* Finalize */

	return !global.ZeresPluginLibrary 
	? class {
		getName() {
			return this.name.replace(/\s+/g, '');
		}

		getAuthor() {
			return this.author;
		}

		getVersion() {
			return this.version;
		}

		getDescription() {
			return this.description;
		}

		stop() {
			log('Stopped!');
		}

		load() {
			const title = 'Library Missing';
			const ModalStack = window.BdApi.findModuleByProps('push', 'update', 'pop', 'popWithKey');
			const TextElement = window.BdApi.findModuleByProps('Sizes', 'Weights');
			const ConfirmationModal = window.BdApi.findModule((m) => m.defaultProps && m.key && m.key() === 'confirm-modal');
			if (!ModalStack || !ConfirmationModal || !TextElement) return window.BdApi.getCore().alert(title, `The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
			ModalStack.push(function(props) {
				return window.BdApi.React.createElement(ConfirmationModal, Object.assign({
					header: title,
					children: [
						TextElement({
							color: TextElement.Colors.PRIMARY,
							children: [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`]
						})
					],
					red: false,
					confirmText: 'Download Now',
					cancelText: 'Cancel',
					onConfirm: () => {
						require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
							if (error) return require('electron').shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
							await new Promise(r => require('fs').writeFile(require('path').join(window.ContentManager.pluginsFolder, '0PluginLibrary.plugin.js'), body, r));
						});
					}
				}, props));
			});
		}

		start() {
			log('Started!');
		}

		/* Getters */

		get [Symbol.toStringTag]() {
			return 'Plugin';
		}

		get name() {
			return config.info.name;
		}

		get short() {
			let string = '';

			for (let i = 0, len = config.info.name.length; i < len; i++) {
				const char = config.info.name[i];
				if (char === char.toUpperCase()) string += char;
			}

			return string;
		}

		get author() {
			return config.info.authors.map((author) => author.name).join(', ');
		}

		get version() {
			return config.info.version;
		}

		get description() {
			return config.info.description;
		}
	}
	: buildPlugin(global.ZeresPluginLibrary.buildPlugin(config));
})();

/*@end@*/
