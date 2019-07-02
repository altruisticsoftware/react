import React, { Component } from 'react';
import cx from 'classnames/bind';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import 'react-dropdown-tree-select/dist/styles.css';
import { settings, strings } from '../settings';

const onRegionChange = (currentNode, selectedNodes) => {
	console.log("CURRENT NODE", currentNode);
	console.log("SELECTED NODES", currentNode);
};

export default class Controls extends Component {

	constructor() {
		super();
		this.state = { 
			dropdown: null,
		};
		this.searchInput = React.createRef();
		this.closeDropdown = this.closeDropdown.bind(this);
		this.search = this.search.bind(this);
	}

	//add click listener for dropdowns (in lieu of including bootstrap js + jquery)
	componentDidMount() {
		document.body.addEventListener('click', this.closeDropdown);
	}

	//remove click listener for dropdowns (in lieu of including bootstrap js + jquery)
	componentWillUnmount() {
		document.body.removeEventListener('click', this.closeDropdown);
	}

	//close current dropdown (on body click)
	closeDropdown(e) {
		if (e.srcElement.classList.contains('dropdown-toggle')) return;
		this.setDropdown(null);
	}

	//keyword search
	search(e) {
		if (this.props.state.input.mode != 'search') return;
		this.props.state.input.search = e.target.value;
		this.props.setAppState('input', this.props.state.input);
	}

	//open or close dropdown
	setDropdown(which) {
		this.setState({
			dropdown: this.state.dropdown == which ? null : which
		});
	}

	//set filter: pass it up to parent
	setFilter(e, filter, value) {
		e.preventDefault();
		e.stopPropagation();

		//add or remove from filters
		if (value) {
			if (e.metaKey) {
				const index = this.props.state.input[filter].indexOf(value);
				if (index == -1) {
					this.props.state.input[filter].push(value);
				} else {
					this.props.state.input[filter].splice(index, 1);
				}
			} else {
				this.props.state.input[filter] = [value];
			}
		} else {
			this.props.state.input[filter] = [];
		}

		//sort filters
		this.props.state.input[filter].sort((a, b) => {
			return this.props.state.indexes[filter].findIndex(x => a == x.key) - this.props.state.indexes[filter].findIndex(x => b == x.key);
		});

		//pass it up to app controller
		this.props.setAppState('input', this.props.state.input);
	}

	//set search mode dropdown
	setMode(e, mode) {
		e.preventDefault();
		if (mode == 'me') {
			//clear search value
			this.props.state.input.search = '';
		} else {			
			//focus after waiting for disabled to clear
			setTimeout(function() {
				this.searchInput.current.focus();
			}.bind(this), 100);
		}
		this.props.state.input.mode = mode;
		this.props.setAppState('input', this.props.state.input);
	}

	//toggle list/map view
	setView(e, view) {
		e.preventDefault();
		this.props.state.input.view = view;
		this.props.setAppState('input', this.props.state.input);
	}

	render() {
		console.log("IN CONTROLS RENDER...")
		console.log(this.props.state.region_tree);
		return(
			<div className={cx('row d-print-none', {
				'd-none': this.props.state.loading || this.props.state.input.meeting
			})}>
				<div className="col-sm-6 col-lg">
					<div className="input-group mb-3">
						<input type="search" 
							className="form-control" 
							onChange={this.search}
							value={this.props.state.input.search}
							ref={this.searchInput} 
							placeholder={strings.modes[this.props.state.input.mode]} 
							disabled={this.props.state.input.mode == 'me'}
							spellCheck="false"
							/>
						<div className="input-group-append">
							<button className="btn btn-outline-secondary dropdown-toggle" onClick={e => this.setDropdown('search')}></button>
							<div className={cx('dropdown-menu dropdown-menu-right', { show: (this.state.dropdown == 'search') })}>
							{settings.modes.map(x => 
								<a key={x} className={cx('dropdown-item d-flex justify-content-between align-items-center', {
									'active bg-secondary': (this.props.state.input.mode == x)
								})} href="#" onClick={e => this.setMode(e, x)}>
								{strings.modes[x]}
								</a>
							)}
							</div>
						</div>
					</div>
				</div>
				<div className={cx('col-sm-6 col-lg mb-3')}>
					<DropdownTreeSelect
						data={this.props.state.region_tree}
						onChange={onRegionChange}
						className="bootstrap-region-tree"
					/>
				</div>
				{settings.filters.map(filter =>
				<div className={cx('col-sm-6 col-lg mb-3', {'d-none': !this.props.state.capabilities[filter]})} key={filter}>
					<div className="dropdown">
						<button className="btn btn-outline-secondary w-100 dropdown-toggle" onClick={e => this.setDropdown(filter)}>
							{this.props.state.input[filter].length && this.props.state.indexes[filter].length ? this.props.state.input[filter].map(x => {
								return this.props.state.indexes[filter].find(y => y.key == x).name;
							}).join(' + ') : strings[filter + '_any']}
						</button>
						<div className={cx('dropdown-menu', { show: (this.state.dropdown == filter), 'dropdown-menu-right': (filter == 'type') && !this.props.state.capabilities.map })}>
							<a className={cx('dropdown-item', { 'active bg-secondary': !this.props.state.input[filter].length })} onClick={e => this.setFilter(e, filter, null)} href="#">
								{strings[filter + '_any']}
							</a>
							<div className="dropdown-divider"></div>
							{this.props.state.indexes[filter].map(x => 
								<a key={x.key} className={cx('dropdown-item d-flex justify-content-between align-items-center', {
									'active bg-secondary': (this.props.state.input[filter].indexOf(x.key) !== -1)
								})} href="#" onClick={e => this.setFilter(e, filter, x.key)}>
									<span>{x.name}</span>
									<span className="badge badge-light ml-3">{x.slugs.length}</span>
								</a>
							)}
						</div>
					</div>
				</div>
				)}
				<div className={cx('col-sm-6 col-lg mb-3', {'d-none': !this.props.state.capabilities.map})}>
					<div className="btn-group w-100" role="group">
						<button type="button" className={cx('btn btn-outline-secondary w-100', { active: this.props.state.input.view == 'list' })} onClick={e => this.setView(e, 'list')}>{strings.list}</button>
						<button type="button" className={cx('btn btn-outline-secondary w-100', { active: this.props.state.input.view == 'map' })} onClick={e => this.setView(e, 'map')}>{strings.map}</button>
					</div>
				</div>
			</div>
		);
	}
}
